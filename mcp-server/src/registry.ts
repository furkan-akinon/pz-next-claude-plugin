import { TTLCache } from './cache.js';
import {
  NPM_REGISTRY_URL,
  NPM_SCOPE,
  CACHE_TTL_MS,
  REQUEST_TIMEOUT_MS,
  MAX_RETRIES,
  RETRY_DELAY_MS,
  PLUGIN_CATEGORIES,
} from './constants.js';
import type {
  NpmPackageDocument,
  NpmSearchResult,
  PluginSummary,
  PluginDetail,
  VersionEntry,
  PluginCategory,
} from './types.js';

const log = (level: string, msg: string, meta?: Record<string, unknown>) => {
  const entry = { ts: new Date().toISOString(), level, msg, ...meta };
  process.stderr.write(JSON.stringify(entry) + '\n');
};

export class NpmRegistryClient {
  private packageCache: TTLCache<NpmPackageDocument>;
  private searchCache: TTLCache<NpmSearchResult>;
  private readonly token: string | undefined;

  constructor() {
    this.packageCache = new TTLCache<NpmPackageDocument>(CACHE_TTL_MS);
    this.searchCache = new TTLCache<NpmSearchResult>(CACHE_TTL_MS);
    this.token = process.env.NPM_TOKEN;
  }

  async listPlugins(): Promise<PluginSummary[]> {
    const searchResult = await this.searchPackages();
    const plugins: PluginSummary[] = [];

    for (const obj of searchResult.objects) {
      const pkg = obj.package;
      const shortName = pkg.name.replace(`${NPM_SCOPE}/`, '');

      plugins.push({
        name: shortName,
        packageName: pkg.name,
        latestVersion: pkg.version,
        description: pkg.description ?? '',
        category: this.resolveCategory(shortName),
        lastPublished: pkg.date,
      });
    }

    return plugins.sort((a, b) => {
      const catOrder = this.categoryOrder(a.category) - this.categoryOrder(b.category);
      if (catOrder !== 0) return catOrder;
      return a.name.localeCompare(b.name);
    });
  }

  async getPluginDetail(pluginName: string): Promise<PluginDetail> {
    const packageName = this.toPackageName(pluginName);
    const doc = await this.fetchPackageDocument(packageName);

    const latestTag = doc['dist-tags']?.latest ?? Object.keys(doc.versions).pop()!;
    const latestMeta = doc.versions[latestTag];

    const allVersions: VersionEntry[] = Object.keys(doc.versions)
      .map((v) => ({
        version: v,
        publishedAt: doc.time?.[v] ?? '',
      }))
      .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());

    const shortName = pluginName.startsWith('pz-') ? pluginName : `pz-${pluginName}`;

    return {
      name: shortName,
      packageName,
      latestVersion: latestTag,
      description: latestMeta?.description ?? doc.description ?? '',
      category: this.resolveCategory(shortName),
      lastPublished: doc.time?.[latestTag],
      distTags: doc['dist-tags'] ?? {},
      allVersions,
      peerDependencies: latestMeta?.peerDependencies ?? {},
    };
  }

  async getPluginVersions(pluginName: string): Promise<VersionEntry[]> {
    const detail = await this.getPluginDetail(pluginName);
    return detail.allVersions;
  }

  async checkUpdates(
    installedDeps: Record<string, string>
  ): Promise<
    Array<{
      name: string;
      packageName: string;
      installedVersion: string;
      latestVersion: string;
      updateAvailable: boolean;
    }>
  > {
    const pzDeps = Object.entries(installedDeps).filter(([name]) =>
      name.startsWith(`${NPM_SCOPE}/pz-`)
    );

    const results = await Promise.allSettled(
      pzDeps.map(async ([packageName, installedRange]) => {
        const doc = await this.fetchPackageDocument(packageName);
        const latestVersion = doc['dist-tags']?.latest ?? '';
        const installedVersion = installedRange.replace(/[\^~>=<]/g, '').trim();

        return {
          name: packageName.replace(`${NPM_SCOPE}/`, ''),
          packageName,
          installedVersion,
          latestVersion,
          updateAvailable: installedVersion !== latestVersion,
        };
      })
    );

    return results
      .filter((r): r is PromiseFulfilledResult<(typeof results extends Array<PromiseSettledResult<infer T>> ? T : never)> => r.status === 'fulfilled')
      .map((r) => r.value as {
        name: string;
        packageName: string;
        installedVersion: string;
        latestVersion: string;
        updateAvailable: boolean;
      });
  }

  private async searchPackages(): Promise<NpmSearchResult> {
    const cacheKey = 'search:pz-all';
    const cached = this.searchCache.get(cacheKey);
    if (cached) return cached;

    const url = `${NPM_REGISTRY_URL}/-/v1/search?text=scope:akinon+pz-&size=250`;
    const result = await this.fetchJson<NpmSearchResult>(url);

    result.objects = result.objects.filter((obj) =>
      obj.package.name.startsWith(`${NPM_SCOPE}/pz-`)
    );

    this.searchCache.set(cacheKey, result);
    return result;
  }

  private async fetchPackageDocument(packageName: string): Promise<NpmPackageDocument> {
    const cached = this.packageCache.get(packageName);
    if (cached) return cached;

    const encodedName = packageName.replace('/', '%2F');
    const url = `${NPM_REGISTRY_URL}/${encodedName}`;
    const doc = await this.fetchJson<NpmPackageDocument>(url);

    this.packageCache.set(packageName, doc);
    return doc;
  }

  private async fetchJson<T>(url: string, attempt = 1): Promise<T> {
    const headers: Record<string, string> = {
      Accept: 'application/json',
    };
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

      const response = await fetch(url, {
        headers,
        signal: controller.signal,
      });
      clearTimeout(timeout);

      if (response.status === 429) {
        const retryAfter = parseInt(response.headers.get('retry-after') ?? '5', 10);
        log('warn', 'Rate limited by npm registry', { retryAfter, url });
        await this.sleep(retryAfter * 1000);
        return this.fetchJson<T>(url, attempt);
      }

      if (!response.ok) {
        const body = await response.text().catch(() => '');
        throw new RegistryError(
          `npm registry returned ${response.status}: ${body}`,
          response.status
        );
      }

      return (await response.json()) as T;
    } catch (error) {
      if (error instanceof RegistryError) throw error;

      if (attempt <= MAX_RETRIES) {
        log('warn', `Request failed, retrying (${attempt}/${MAX_RETRIES})`, {
          url,
          error: String(error),
        });
        await this.sleep(RETRY_DELAY_MS * attempt);
        return this.fetchJson<T>(url, attempt + 1);
      }

      throw new RegistryError(
        `Failed to fetch ${url} after ${MAX_RETRIES} retries: ${error}`,
        0
      );
    }
  }

  private toPackageName(name: string): string {
    const shortName = name.startsWith(`${NPM_SCOPE}/`) ? name.replace(`${NPM_SCOPE}/`, '') : name;
    const pluginName = shortName.startsWith('pz-') ? shortName : `pz-${shortName}`;
    return `${NPM_SCOPE}/${pluginName}`;
  }

  private resolveCategory(shortName: string): PluginCategory {
    return PLUGIN_CATEGORIES[shortName] ?? 'unknown';
  }

  private categoryOrder(cat: PluginCategory): number {
    const order: Record<PluginCategory, number> = {
      payment: 0,
      bnpl: 1,
      'quick-checkout': 2,
      shopping: 3,
      business: 4,
      utility: 5,
      unknown: 6,
    };
    return order[cat];
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

export class RegistryError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number
  ) {
    super(message);
    this.name = 'RegistryError';
  }
}

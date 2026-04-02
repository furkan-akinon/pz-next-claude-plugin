import { TTLCache } from './cache.js';
import { CACHE_TTL_MS, REQUEST_TIMEOUT_MS, MAX_RETRIES, RETRY_DELAY_MS } from './constants.js';
import type { ChangelogCommit, ChangelogResult } from './types.js';

const BITBUCKET_API = 'https://api.bitbucket.org/2.0';
const REPO = 'akinonteam/pz-next';
const TICKET_PATTERN = /\b(ZERO|BRDG)-\d+\b/;
const SKIP_PATTERNS = [/^Publish.*\[skip ci\]/, /^Merge (main|master|beta|rc) into/];

const log = (level: string, msg: string, meta?: Record<string, unknown>) => {
  process.stderr.write(JSON.stringify({ ts: new Date().toISOString(), level, msg, ...meta }) + '\n');
};

export class BitbucketClient {
  private tagCache: TTLCache<string[]>;
  private commitCache: TTLCache<ChangelogCommit[]>;

  constructor() {
    this.tagCache = new TTLCache<string[]>(CACHE_TTL_MS);
    this.commitCache = new TTLCache<ChangelogCommit[]>(CACHE_TTL_MS);
  }

  async getChangelog(packageName: string, fromVersion: string, toVersion: string): Promise<ChangelogResult> {
    const fromTag = `${packageName}@${fromVersion}`;
    const toTag = `${packageName}@${toVersion}`;
    const cacheKey = `${fromTag}..${toTag}`;

    let commits = this.commitCache.get(cacheKey);
    if (!commits) {
      commits = await this.fetchCommitsBetween(fromTag, toTag);
      this.commitCache.set(cacheKey, commits);
    }

    return {
      plugin: packageName,
      from: fromVersion,
      to: toVersion,
      commits,
    };
  }

  async getLatestChanges(packageName: string, version: string): Promise<ChangelogCommit[]> {
    const tags = await this.getVersionTags(packageName);
    const currentIdx = tags.indexOf(version);
    if (currentIdx === -1 || currentIdx >= tags.length - 1) return [];

    const previousVersion = tags[currentIdx + 1];
    const result = await this.getChangelog(packageName, previousVersion, version);
    return result.commits;
  }

  private async getVersionTags(packageName: string): Promise<string[]> {
    const cacheKey = `tags:${packageName}`;
    const cached = this.tagCache.get(cacheKey);
    if (cached) return cached;

    const url = `${BITBUCKET_API}/repositories/${REPO}/refs/tags?q=name+~+"${packageName}"&sort=-name&pagelen=50`;
    const data = await this.fetchJson<{ values: Array<{ name: string; target: { date: string } }> }>(url);

    const sorted = data.values
      .map((t) => ({
        version: t.name.replace(`${packageName}@`, ''),
        date: t.target.date,
      }))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .map((t) => t.version);

    this.tagCache.set(cacheKey, sorted);
    return sorted;
  }

  private async fetchCommitsBetween(fromTag: string, toTag: string): Promise<ChangelogCommit[]> {
    const encodedFrom = encodeURIComponent(fromTag);
    const encodedTo = encodeURIComponent(toTag);
    const url = `${BITBUCKET_API}/repositories/${REPO}/commits?include=${encodedTo}&exclude=${encodedFrom}&pagelen=30`;

    try {
      const data = await this.fetchJson<{
        values: Array<{
          hash: string;
          date: string;
          message: string;
          author: { raw: string; user?: { display_name: string } };
        }>;
      }>(url);

      return data.values
        .map((c) => {
          const firstLine = c.message.split('\n')[0].trim();
          const ticketMatch = c.message.match(TICKET_PATTERN);
          return {
            hash: c.hash.substring(0, 7),
            date: c.date.split('T')[0],
            message: firstLine,
            author: c.author.user?.display_name ?? c.author.raw.split('<')[0].trim(),
            ticket: ticketMatch?.[0],
          };
        })
        .filter((c) => !SKIP_PATTERNS.some((p) => p.test(c.message)));
    } catch (error) {
      log('warn', 'Failed to fetch commits from Bitbucket', { fromTag, toTag, error: String(error) });
      return [];
    }
  }

  private async fetchJson<T>(url: string, attempt = 1): Promise<T> {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

      const response = await fetch(url, {
        headers: { Accept: 'application/json' },
        signal: controller.signal,
      });
      clearTimeout(timeout);

      if (!response.ok) {
        throw new Error(`Bitbucket API returned ${response.status}`);
      }

      return (await response.json()) as T;
    } catch (error) {
      if (attempt <= MAX_RETRIES) {
        await new Promise((r) => setTimeout(r, RETRY_DELAY_MS * attempt));
        return this.fetchJson<T>(url, attempt + 1);
      }
      throw error;
    }
  }
}

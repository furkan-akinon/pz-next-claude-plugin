export interface NpmPackageDocument {
  name: string;
  version: string;
  description?: string;
  versions: Record<string, NpmVersionDocument>;
  'dist-tags': Record<string, string>;
  time: Record<string, string>;
  readme?: string;
}

export interface NpmVersionDocument {
  name: string;
  version: string;
  description?: string;
  dependencies?: Record<string, string>;
  peerDependencies?: Record<string, string>;
}

export interface NpmSearchResult {
  objects: Array<{
    package: {
      name: string;
      version: string;
      description?: string;
      date: string;
      keywords?: string[];
    };
  }>;
  total: number;
}

export interface PluginSummary {
  name: string;
  packageName: string;
  latestVersion: string;
  description: string;
  category: PluginCategory;
  lastPublished?: string;
}

export interface PluginDetail extends PluginSummary {
  distTags: Record<string, string>;
  allVersions: VersionEntry[];
  dependencies: Record<string, string>;
  peerDependencies: Record<string, string>;
  deprecation?: string;
}

export interface VersionEntry {
  version: string;
  publishedAt: string;
}

export interface UpdateCheckResult {
  name: string;
  packageName: string;
  installedVersion: string;
  latestVersion: string;
  updateAvailable: boolean;
  behindBy: number;
}

export type PluginCategory =
  | 'payment'
  | 'bnpl'
  | 'quick-checkout'
  | 'shopping'
  | 'business'
  | 'utility'
  | 'unknown';

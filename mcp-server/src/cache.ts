interface CacheEntry<T> {
  data: T;
  createdAt: number;
  expiresAt: number;
}

export class TTLCache<T> {
  private store = new Map<string, CacheEntry<T>>();
  private readonly ttl: number;
  private readonly maxSize: number;

  constructor(ttlMs: number, maxSize = 500) {
    this.ttl = ttlMs;
    this.maxSize = maxSize;
  }

  get(key: string): T | null {
    const entry = this.store.get(key);
    if (!entry) return null;

    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return null;
    }

    return entry.data;
  }

  /** Returns stale data if available, even if expired. */
  getStale(key: string): T | null {
    const entry = this.store.get(key);
    return entry?.data ?? null;
  }

  set(key: string, data: T): void {
    if (this.store.size >= this.maxSize) {
      this.evictOldest();
    }

    const now = Date.now();
    this.store.set(key, {
      data,
      createdAt: now,
      expiresAt: now + this.ttl,
    });
  }

  has(key: string): boolean {
    return this.get(key) !== null;
  }

  invalidate(key: string): void {
    this.store.delete(key);
  }

  clear(): void {
    this.store.clear();
  }

  get size(): number {
    return this.store.size;
  }

  private evictOldest(): void {
    let oldestKey: string | null = null;
    let oldestTime = Infinity;

    for (const [key, entry] of this.store) {
      if (entry.createdAt < oldestTime) {
        oldestTime = entry.createdAt;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.store.delete(oldestKey);
    }
  }
}

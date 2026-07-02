import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface CacheEntry<T> {
  data: T;
  expiresAt: number;
  /** ETag header value returned by GitHub for this response, if any. */
  etag?: string;
}

@Injectable()
export class CacheService implements OnModuleDestroy {
  private readonly logger = new Logger(CacheService.name);
  private cache = new Map<string, CacheEntry<unknown>>();
  private readonly defaultTtl: number;
  private readonly maxLimit = 1000;
  private readonly sweepInterval: NodeJS.Timeout;

  constructor(private configService: ConfigService) {
    const raw = this.configService.get<string>('CACHE_TTL_SECONDS');
    const parsed = parseInt(raw, 10);
    if (!isNaN(parsed) && parsed > 0) {
      if (parsed < 10) {
        this.logger.warn(
          `CACHE_TTL_SECONDS is set very low (${parsed}s) — this may hammer the GitHub API`,
        );
      }
      this.defaultTtl = parsed;
    } else {
      this.defaultTtl = 300;
    }

    // Set up a background sweep every 60 seconds to purge expired entries
    this.sweepInterval = setInterval(() => {
      this.sweepExpired();
    }, 60000);
    if (this.sweepInterval && typeof this.sweepInterval.unref === 'function') {
      this.sweepInterval.unref();
    }
  }

  onModuleDestroy(): void {
    if (this.sweepInterval) {
      clearInterval(this.sweepInterval);
    }
  }

  private sweepExpired(): void {
    const now = Date.now();
    let purgedCount = 0;
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(key);
        purgedCount++;
      }
    }
    if (purgedCount > 0) {
      this.logger.debug(`Purged ${purgedCount} expired cache entries.`);
    }
  }

  get<T = unknown>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  /**
   * Check if a key exists in the cache (not expired).
   * Returns true even if the cached value is null.
   */
  has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;

    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  /**
   * Returns the stored ETag for a cache key, or undefined if the key
   * does not exist or has expired.
   */
  getEtag(key: string): string | undefined {
    const entry = this.cache.get(key);
    if (!entry) return undefined;

    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return undefined;
    }

    return entry.etag;
  }

  /**
   * Expose cached items (even if expired) for ETag verification/conditional requests.
   */
  getRawEntry<T = unknown>(key: string): CacheEntry<T> | undefined {
    return this.cache.get(key) as CacheEntry<T> | undefined;
  }

  set<T = unknown>(
    key: string,
    data: T,
    ttlSeconds?: number,
    etag?: string,
  ): void {
    const ttl = ttlSeconds ?? this.defaultTtl;

    // FIFO Eviction: if limit reached and key is new, remove oldest key
    if (!this.cache.has(key) && this.cache.size >= this.maxLimit) {
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey !== undefined) {
        this.cache.delete(oldestKey);
      }
    }

    this.cache.set(key, {
      data,
      expiresAt: Date.now() + ttl * 1000,
      ...(etag !== undefined ? { etag } : {}),
    });
  }

  /**
   * Extends the TTL of an existing, non-expired cache entry without
   * changing its data or ETag. Returns true if the entry existed and
   * was refreshed, false if it was missing or already expired.
   */
  refresh(key: string, ttlSeconds?: number): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;

    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return false;
    }

    const ttl = ttlSeconds ?? this.defaultTtl;
    entry.expiresAt = Date.now() + ttl * 1000;
    return true;
  }

  delete(key: string): void {
    this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }
}

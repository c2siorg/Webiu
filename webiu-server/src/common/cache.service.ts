import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
  /** ETag header value returned by GitHub for this response, if any. */
  etag?: string;
}

@Injectable()
export class CacheService {
  private readonly logger = new Logger(CacheService.name);
  private cache = new Map<string, CacheEntry<unknown>>();
  private readonly defaultTtl: number;

  /**
   * Tracks in-flight fetch promises keyed by cache key.
   * Prevents cache stampedes: concurrent callers for the same cold-cache key
   * share one promise instead of each firing an independent HTTP request.
   */
  private readonly inFlight = new Map<string, Promise<unknown>>();

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

  set<T = unknown>(key: string, data: T, ttlSeconds?: number, etag?: string): void {
    const ttl = ttlSeconds ?? this.defaultTtl;
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

  /**
   * Deduplicates concurrent fetches for the same cache key.
   *
   * If a cached value already exists it is returned immediately.
   * If a fetch for this key is already in-flight, the same promise is returned
   * to all concurrent callers — only one HTTP request is ever made.
   * Once the fetch resolves the result is stored via `set()` using the provided
   * TTL, the in-flight entry is removed, and all waiters receive the result.
   *
   * @param key       Cache key
   * @param fetcher   Async function that performs the actual fetch and returns
   *                  `{ data: T; ttlSeconds?: number; etag?: string }`. The caller
   *                  controls TTL and the optional ETag for conditional-request support.
   */
  async dedup<T = unknown>(
    key: string,
    fetcher: () => Promise<{ data: T; ttlSeconds?: number; etag?: string }>,
  ): Promise<T> {
    const cached = this.get<T>(key);
    if (cached !== null) return cached;

    const existing = this.inFlight.get(key);
    if (existing) return existing as Promise<T>;

    const promise = fetcher()
      .then(({ data, ttlSeconds, etag }) => {
        this.set(key, data, ttlSeconds, etag);
        return data;
      })
      .finally(() => {
        this.inFlight.delete(key);
      });

    this.inFlight.set(key, promise as Promise<unknown>);
    return promise;
  }

  delete(key: string): void {
    this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
    this.inFlight.clear();
  }
}

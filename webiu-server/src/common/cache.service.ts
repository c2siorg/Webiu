import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

@Injectable()
export class CacheService {
  private readonly logger = new Logger(CacheService.name);
  private cache = new Map<string, CacheEntry<any>>();
  private readonly defaultTtl: number;

  /**
   * OPTIMIZATION: Bounded cache size to prevent unbounded memory growth.
   *
   * PROBLEM: The original Map had no size limit. With many unique cache keys
   * (different usernames, repos, queries) the Map grows indefinitely until the
   * process restarts. In a long-running server under load this is a memory leak.
   *
   * SOLUTION: Cap at CACHE_MAX_SIZE entries (default 500). JS Maps preserve
   * insertion order, so `map.keys().next()` is always the oldest entry.
   * When at capacity, evict the oldest entry before inserting a new key.
   * Updating an existing key does NOT evict (Map.set on existing key doesn't
   * change its insertion order in V8, but we skip eviction for overwrites anyway).
   */
  private readonly maxSize: number;

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

    const maxRaw = this.configService.get<string>('CACHE_MAX_SIZE');
    const maxParsed = parseInt(maxRaw, 10);
    this.maxSize = !isNaN(maxParsed) && maxParsed > 0 ? maxParsed : 500;
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  set<T>(key: string, data: T, ttlSeconds?: number): void {
    const ttl = ttlSeconds ?? this.defaultTtl;

    // Evict the oldest entry when adding a new key at capacity
    if (!this.cache.has(key) && this.cache.size >= this.maxSize) {
      const oldestKey = this.cache.keys().next().value;
      this.cache.delete(oldestKey);
    }

    this.cache.set(key, {
      data,
      expiresAt: Date.now() + ttl * 1000,
    });
  }

  delete(key: string): void {
    this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }
}

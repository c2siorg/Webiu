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
  private readonly maxCacheSize: number;
  private readonly sweepIntervalMs: number;
  private sweepTimeout: NodeJS.Timeout;

  constructor(private configService: ConfigService) {
    // TTL Configuration
    const rawTtl = this.configService.get<string>('CACHE_TTL_SECONDS');
    const parsedTtl = parseInt(rawTtl, 10);
    this.defaultTtl = !isNaN(parsedTtl) && parsedTtl > 0 ? parsedTtl : 300;

    if (this.defaultTtl < 10) {
      this.logger.warn(
        `CACHE_TTL_SECONDS is set very low (${this.defaultTtl}s) — this may hammer the GitHub API`,
      );
    }

    // LRU & Sweep Configuration
    const rawMaxSize = this.configService.get<string>('CACHE_MAX_SIZE');
    const parsedMaxSize = parseInt(rawMaxSize, 10);
    this.maxCacheSize =
      !isNaN(parsedMaxSize) && parsedMaxSize > 0 ? parsedMaxSize : 1000;

    const rawSweep = this.configService.get<string>(
      'CACHE_SWEEP_INTERVAL_SECONDS',
    );
    const parsedSweep = parseInt(rawSweep, 10);
    this.sweepIntervalMs =
      (!isNaN(parsedSweep) && parsedSweep > 0 ? parsedSweep : 60) * 1000;

    this.scheduleSweep();
  }

  onModuleDestroy() {
    if (this.sweepTimeout) {
      clearTimeout(this.sweepTimeout);
    }
  }

  private scheduleSweep() {
    this.sweepTimeout = setTimeout(() => {
      this.sweep();
      this.scheduleSweep();
    }, this.sweepIntervalMs);
  }

  private sweep() {
    const now = Date.now();
    let evictedCount = 0;
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(key);
        evictedCount++;
      }
    }
    if (evictedCount > 0) {
      this.logger.debug(`Swept ${evictedCount} expired cache entries`);
    }
  }

  get<T = unknown>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    // Move to end (most recently used)
    this.cache.delete(key);
    this.cache.set(key, entry);

    return entry.data as T;
  }

  has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;

    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  getEtag(key: string): string | undefined {
    const entry = this.cache.get(key);
    if (!entry) return undefined;

    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return undefined;
    }

    return entry.etag;
  }

  set<T = unknown>(
    key: string,
    data: T,
    ttlSeconds?: number,
    etag?: string,
  ): void {
    const ttl = ttlSeconds ?? this.defaultTtl;

    // If key exists, delete it first to ensure it moved to the end
    if (this.cache.has(key)) {
      this.cache.delete(key);
    } else if (this.cache.size >= this.maxCacheSize) {
      // Evict least recently used (first item in Map)
      const firstKey = this.cache.keys().next().value;
      if (firstKey !== undefined) {
        this.cache.delete(firstKey);
      }
    }

    this.cache.set(key, {
      data,
      expiresAt: Date.now() + ttl * 1000,
      ...(etag !== undefined ? { etag } : {}),
    });
  }

  refresh(key: string, ttlSeconds?: number): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;

    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return false;
    }

    const ttl = ttlSeconds ?? this.defaultTtl;
    entry.expiresAt = Date.now() + ttl * 1000;

    // Move to end
    this.cache.delete(key);
    this.cache.set(key, entry);

    return true;
  }

  delete(key: string): void {
    this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }
}

import { Injectable } from '@nestjs/common';

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
  lastAccessed: number;
}

@Injectable()
export class CacheService {
  private cache = new Map<string, CacheEntry<any>>();
  private readonly MAX_CACHE_SIZE = 500;
  private readonly CLEANUP_INTERVAL = 60000; // 1 minute

  constructor() {
    // Periodic cleanup of expired entries
    setInterval(() => this.cleanupExpired(), this.CLEANUP_INTERVAL);
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    // Update last accessed time for LRU
    entry.lastAccessed = Date.now();
    return entry.data as T;
  }

  set<T>(key: string, data: T, ttlSeconds: number): void {
    // Enforce max cache size using LRU eviction
    if (this.cache.size >= this.MAX_CACHE_SIZE && !this.cache.has(key)) {
      this.evictLRU();
    }

    this.cache.set(key, {
      data,
      expiresAt: Date.now() + ttlSeconds * 1000,
      lastAccessed: Date.now(),
    });
  }

  delete(key: string): void {
    this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  private cleanupExpired(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(key);
      }
    }
  }

  private evictLRU(): void {
    let oldestKey: string | null = null;
    let oldestTime = Infinity;

    for (const [key, entry] of this.cache.entries()) {
      if (entry.lastAccessed < oldestTime) {
        oldestTime = entry.lastAccessed;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey);
    }
  }
}

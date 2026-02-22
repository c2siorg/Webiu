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

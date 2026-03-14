import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
  /** ETag header value returned by GitHub for this response, if any. */
  etag?: string;
}

interface RedisPayload<T> {
  data: T;
  etag?: string;
}

@Injectable()
export class CacheService implements OnModuleDestroy {
  private readonly logger = new Logger(CacheService.name);
  private readonly memCache = new Map<string, CacheEntry<unknown>>();
  private readonly redis: Redis | null = null;
  readonly defaultTtl: number;

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

    const redisUrl = this.configService.get<string>('REDIS_URL');
    if (redisUrl) {
      this.redis = new Redis(redisUrl, { lazyConnect: true });
      this.redis.on('error', (err: Error) =>
        this.logger.error('Redis connection error:', err.message),
      );
      this.redis
        .connect()
        .then(() =>
          this.logger.log('Redis connected — using distributed cache'),
        )
        .catch((err: Error) =>
          this.logger.error(
            'Redis connect failed, falling back to in-memory cache:',
            err.message,
          ),
        );
    } else {
      this.logger.log('No REDIS_URL configured — using in-memory cache');
    }
  }

  async onModuleDestroy(): Promise<void> {
    if (this.redis) {
      await this.redis.quit();
    }
  }

  async get<T = unknown>(key: string): Promise<T | null> {
    if (this.redis && this.redis.status === 'ready') {
      const raw = await this.redis.get(key);
      if (raw === null) return null;
      const payload = JSON.parse(raw) as RedisPayload<T>;
      return payload.data;
    }

    const entry = this.memCache.get(key);
    if (!entry) return null;

    if (Date.now() > entry.expiresAt) {
      this.memCache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  async has(key: string): Promise<boolean> {
    if (this.redis && this.redis.status === 'ready') {
      return (await this.redis.exists(key)) === 1;
    }

    const entry = this.memCache.get(key);
    if (!entry) return false;

    if (Date.now() > entry.expiresAt) {
      this.memCache.delete(key);
      return false;
    }

    return true;
  }

  async getEtag(key: string): Promise<string | undefined> {
    if (this.redis && this.redis.status === 'ready') {
      const raw = await this.redis.get(key);
      if (raw === null) return undefined;
      const payload = JSON.parse(raw) as RedisPayload<unknown>;
      return payload.etag;
    }

    const entry = this.memCache.get(key);
    if (!entry) return undefined;

    if (Date.now() > entry.expiresAt) {
      this.memCache.delete(key);
      return undefined;
    }

    return entry.etag;
  }

  async set<T = unknown>(
    key: string,
    data: T,
    ttlSeconds?: number,
    etag?: string,
  ): Promise<void> {
    const ttl = ttlSeconds ?? this.defaultTtl;

    if (this.redis && this.redis.status === 'ready') {
      const payload: RedisPayload<T> = {
        data,
        ...(etag !== undefined ? { etag } : {}),
      };
      await this.redis.setex(key, ttl, JSON.stringify(payload));
      return;
    }

    this.memCache.set(key, {
      data,
      expiresAt: Date.now() + ttl * 1000,
      ...(etag !== undefined ? { etag } : {}),
    });
  }

  async refresh(key: string, ttlSeconds?: number): Promise<boolean> {
    const ttl = ttlSeconds ?? this.defaultTtl;

    if (this.redis && this.redis.status === 'ready') {
      const result = await this.redis.expire(key, ttl);
      return result === 1;
    }

    const entry = this.memCache.get(key);
    if (!entry) return false;

    if (Date.now() > entry.expiresAt) {
      this.memCache.delete(key);
      return false;
    }

    entry.expiresAt = Date.now() + ttl * 1000;
    return true;
  }

  async delete(key: string): Promise<void> {
    if (this.redis && this.redis.status === 'ready') {
      await this.redis.del(key);
      return;
    }

    this.memCache.delete(key);
  }

  async clear(): Promise<void> {
    if (this.redis && this.redis.status === 'ready') {
      await this.redis.flushdb();
      return;
    }

    this.memCache.clear();
  }
}

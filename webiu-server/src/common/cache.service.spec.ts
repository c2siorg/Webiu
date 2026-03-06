import { CacheService } from './cache.service';

function mockConfig(ttl?: string) {
  return { get: jest.fn().mockReturnValue(ttl) } as any;
}

describe('CacheService', () => {
  let service: CacheService;

  beforeEach(() => {
    service = new CacheService(mockConfig());
  });

  it('should store and retrieve values', () => {
    service.set('key', 'value', 60);
    expect(service.get('key')).toBe('value');
  });

  it('should return null for missing keys', () => {
    expect(service.get('nonexistent')).toBeNull();
  });

  it('should return null for expired entries', () => {
    jest.useFakeTimers();
    jest.setSystemTime(0);
    service.set('key', 'value', 1);
    expect(service.get('key')).toBe('value');

    jest.advanceTimersByTime(1100);
    expect(service.get('key')).toBeNull();

    jest.useRealTimers();
  });

  it('should delete a specific key', () => {
    service.set('key', 'value', 60);
    service.delete('key');
    expect(service.get('key')).toBeNull();
  });

  it('has() should return true even for falsy cached values', () => {
    // get() returns null for missing keys, so callers must use has() when the
    // cached value itself could be falsy (0, false, '', [])
    service.set('zero', 0 as unknown, 60);
    service.set('empty', [], 60);
    service.set('falsy', false as unknown, 60);
    expect(service.has('zero')).toBe(true);
    expect(service.has('empty')).toBe(true);
    expect(service.has('falsy')).toBe(true);
    expect(service.has('nonexistent')).toBe(false);
  });

  it('should clear all entries', () => {
    service.set('key1', 'value1', 60);
    service.set('key2', 'value2', 60);
    service.clear();
    expect(service.get('key1')).toBeNull();
    expect(service.get('key2')).toBeNull();
  });

  it('should handle complex objects', () => {
    const data = { repos: [{ name: 'repo1' }], count: 5 };
    service.set('complex', data, 60);
    expect(service.get('complex')).toEqual(data);
  });

  describe('TTL configuration', () => {
    beforeEach(() => {
      jest.useFakeTimers();
      jest.setSystemTime(0);
    });
    afterEach(() => jest.useRealTimers());

    it('should use CACHE_TTL_SECONDS from config as default TTL', () => {
      const s = new CacheService(mockConfig('60'));

      s.set('key', 'value');
      jest.advanceTimersByTime(59_000);
      expect(s.get('key')).toBe('value');

      s.set('key2', 'value2');
      jest.advanceTimersByTime(61_000);
      expect(s.get('key2')).toBeNull();
    });

    it('should fall back to 300s when CACHE_TTL_SECONDS is missing', () => {
      const s = new CacheService(mockConfig(undefined));
      s.set('key', 'value');
      jest.advanceTimersByTime(301_000);
      expect(s.get('key')).toBeNull();
    });

    it('should fall back to 300s when CACHE_TTL_SECONDS is invalid (NaN)', () => {
      const s = new CacheService(mockConfig('abc'));
      s.set('key', 'value');
      jest.advanceTimersByTime(301_000);
      expect(s.get('key')).toBeNull();
    });

    it('should fall back to 300s when CACHE_TTL_SECONDS is zero or negative', () => {
      const s = new CacheService(mockConfig('0'));
      s.set('key', 'value');
      jest.advanceTimersByTime(301_000);
      expect(s.get('key')).toBeNull();
    });

    it('should use defaultTtl when set() is called without explicit ttlSeconds', () => {
      const s = new CacheService(mockConfig('120'));

      s.set('key', 'value');
      jest.advanceTimersByTime(119_000);
      expect(s.get('key')).toBe('value');

      s.set('key2', 'value2');
      jest.advanceTimersByTime(121_000);
      expect(s.get('key2')).toBeNull();
    });
  });

  describe('getEtag()', () => {
    beforeEach(() => {
      jest.useFakeTimers();
      jest.setSystemTime(0);
    });
    afterEach(() => jest.useRealTimers());

    it('should return the etag stored alongside data', () => {
      service.set('key', 'value', 60, '"abc123"');
      expect(service.getEtag('key')).toBe('"abc123"');
    });

    it('should return undefined when no etag was stored', () => {
      service.set('key', 'value', 60);
      expect(service.getEtag('key')).toBeUndefined();
    });

    it('should return undefined for a missing key', () => {
      expect(service.getEtag('nonexistent')).toBeUndefined();
    });

    it('should return undefined and evict an expired entry', () => {
      service.set('key', 'value', 1, '"etag"');
      jest.advanceTimersByTime(1100);
      expect(service.getEtag('key')).toBeUndefined();
      // entry should have been evicted — get() also returns null
      expect(service.get('key')).toBeNull();
    });

    it('should not affect data retrieval when etag is present', () => {
      service.set('key', { count: 42 }, 60, '"xyz"');
      expect(service.get<{ count: number }>('key')).toEqual({ count: 42 });
      expect(service.getEtag('key')).toBe('"xyz"');
    });
  });

  describe('dedup()', () => {
    it('returns cached value immediately without calling fetcher', async () => {
      service.set('key', 'cached-value', 60);
      const fetcher = jest.fn();

      const result = await service.dedup('key', fetcher);

      expect(result).toBe('cached-value');
      expect(fetcher).not.toHaveBeenCalled();
    });

    it('calls fetcher once and stores result when cache is cold', async () => {
      const fetcher = jest.fn().mockResolvedValue({ data: 'fresh', ttlSeconds: 60 });

      const result = await service.dedup('key', fetcher);

      expect(result).toBe('fresh');
      expect(fetcher).toHaveBeenCalledTimes(1);
      expect(service.get('key')).toBe('fresh');
    });

    it('deduplicates concurrent callers — fetcher called exactly once', async () => {
      let resolveIt: (v: { data: string; ttlSeconds: number }) => void;
      const fetcher = jest.fn(
        () =>
          new Promise<{ data: string; ttlSeconds: number }>((res) => {
            resolveIt = res;
          }),
      );

      // Fire 5 concurrent callers before the fetch resolves
      const promises = [
        service.dedup('key', fetcher),
        service.dedup('key', fetcher),
        service.dedup('key', fetcher),
        service.dedup('key', fetcher),
        service.dedup('key', fetcher),
      ];

      // Resolve the single in-flight fetch
      resolveIt({ data: 'result', ttlSeconds: 60 });
      const results = await Promise.all(promises);

      expect(fetcher).toHaveBeenCalledTimes(1);
      expect(results).toEqual(['result', 'result', 'result', 'result', 'result']);
      expect(service.get('key')).toBe('result');
    });

    it('second call after resolution returns cached value without refetching', async () => {
      const fetcher = jest.fn().mockResolvedValue({ data: 'value', ttlSeconds: 60 });
      await service.dedup('key', fetcher);

      // Cache is now warm; a second call should return the cached value without invoking fetcher2
      const fetcher2 = jest.fn().mockResolvedValue({ data: 'value2', ttlSeconds: 60 });
      const result = await service.dedup('key', fetcher2);

      // Should return cache hit, not call second fetcher
      expect(result).toBe('value');
      expect(fetcher2).not.toHaveBeenCalled();
    });

    it('removes in-flight entry and propagates error when fetcher rejects', async () => {
      const fetcher = jest.fn().mockRejectedValue(new Error('GitHub API down'));

      await expect(service.dedup('key', fetcher)).rejects.toThrow('GitHub API down');

      // After failure, a subsequent call should try the fetcher again (not stuck in-flight)
      const fetcher2 = jest.fn().mockResolvedValue({ data: 'recovered', ttlSeconds: 60 });
      const result = await service.dedup('key', fetcher2);
      expect(result).toBe('recovered');
      expect(fetcher2).toHaveBeenCalledTimes(1);
    });

    it('does not deduplicate different keys — each key fetches independently', async () => {
      const fetcher = jest.fn().mockResolvedValue({ data: 'value', ttlSeconds: 60 });

      await Promise.all([
        service.dedup('key1', fetcher),
        service.dedup('key2', fetcher),
      ]);

      expect(fetcher).toHaveBeenCalledTimes(2);
    });

    it('clear() also removes all in-flight entries', async () => {
      let resolveIt: (v: { data: string }) => void;
      const fetcher = jest.fn(
        () => new Promise<{ data: string }>((res) => { resolveIt = res; }),
      );

      const p = service.dedup('key', fetcher);
      service.clear();

      // After clear, a new call should create a fresh in-flight entry
      const fetcher2 = jest.fn().mockResolvedValue({ data: 'fresh' });
      const result2 = await service.dedup('key', fetcher2);
      expect(result2).toBe('fresh');
      expect(fetcher2).toHaveBeenCalledTimes(1);

      // Resolve the original promise to avoid unhandled rejection
      resolveIt({ data: 'late' });
      await p;
    });
  });

  describe('refresh()', () => {
    beforeEach(() => {
      jest.useFakeTimers();
      jest.setSystemTime(0);
    });
    afterEach(() => jest.useRealTimers());

    it('should return true and extend the TTL of a live entry', () => {
      service.set('key', 'value', 60);

      // t=30s: still alive (original TTL=60s), extend by 120s → new expiry at t=150s
      jest.advanceTimersByTime(30_000);
      expect(service.refresh('key', 120)).toBe(true);

      // t=130s: past original expiry (60s) but within new expiry (150s)
      jest.advanceTimersByTime(100_000);
      expect(service.get('key')).toBe('value');

      // t=151s: past new expiry (150s) → evicted
      jest.advanceTimersByTime(21_000);
      expect(service.get('key')).toBeNull();
    });

    it('should return false for a missing key', () => {
      expect(service.refresh('nonexistent', 60)).toBe(false);
    });

    it('should return false and evict an already-expired entry', () => {
      service.set('key', 'value', 1);
      jest.advanceTimersByTime(1100);
      expect(service.refresh('key', 60)).toBe(false);
      expect(service.get('key')).toBeNull();
    });

    it('should preserve data and etag after refresh', () => {
      service.set('key', { stars: 10 }, 60, '"etag-v1"');
      service.refresh('key', 120);
      expect(service.get<{ stars: number }>('key')).toEqual({ stars: 10 });
      expect(service.getEtag('key')).toBe('"etag-v1"');
    });
  });
});

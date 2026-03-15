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

  describe('LRU and Eviction Policies', () => {
    it('should evict least recently used items when max size is exceeded', () => {
      // Default max size is 1000, let's create a service with a smaller limit
      const config = {
        get: jest.fn((key: string) => {
          if (key === 'CACHE_MAX_SIZE') return '3';
          return undefined;
        }),
      } as any;
      const s = new CacheService(config);

      s.set('a', 1);
      s.set('b', 2);
      s.set('c', 3);
      expect(s.has('a')).toBe(true);

      s.set('d', 4); // Should evict 'a'
      expect(s.has('a')).toBe(false);
      expect(s.has('b')).toBe(true);
      expect(s.has('c')).toBe(true);
      expect(s.has('d')).toBe(true);
    });

    it('should move accessed items to Most Recently Used position (LRU ordering)', () => {
      const config = {
        get: jest.fn((key: string) => {
          if (key === 'CACHE_MAX_SIZE') return '3';
          return undefined;
        }),
      } as any;
      const s = new CacheService(config);

      s.set('a', 1);
      s.set('b', 2);
      s.set('c', 3);

      // Access 'a' so it becomes MRU
      s.get('a');

      s.set('d', 4); // Should evict 'b' (the new LRU), not 'a'
      expect(s.has('b')).toBe(false);
      expect(s.has('a')).toBe(true);
      expect(s.has('c')).toBe(true);
      expect(s.has('d')).toBe(true);
    });

    it('should periodically sweep expired entries', () => {
      jest.useFakeTimers();
      const config = {
        get: jest.fn((key: string) => {
          if (key === 'CACHE_SWEEP_INTERVAL_SECONDS') return '60';
          if (key === 'CACHE_TTL_SECONDS') return '10';
          return undefined;
        }),
      } as any;
      const s = new CacheService(config);

      s.set('key1', 'val1');
      s.set('key2', 'val2');

      // Advance time past TTL but before sweep
      jest.advanceTimersByTime(11_000);
      // Items are logically expired but still in the internal map
      const internalMap = (s as any).cache as Map<string, any>;
      expect(internalMap.size).toBe(2);

      // Advance time to trigger sweep
      jest.advanceTimersByTime(50_000);
      expect(internalMap.size).toBe(0);

      s.onModuleDestroy(); // Clean up timer
      jest.useRealTimers();
    });
  });
});

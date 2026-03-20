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

  describe('pruneExpiredEntries()', () => {
    beforeEach(() => {
      jest.useFakeTimers();
      jest.setSystemTime(0);
    });
    afterEach(() => jest.useRealTimers());

    it('should remove only expired entries', () => {
      service.set('expired1', 'val1', 10); // expires at 10s
      service.set('expired2', 'val2', 20); // expires at 20s
      service.set('valid', 'val3', 60); // expires at 60s

      jest.advanceTimersByTime(30000); // Now at 30s

      service.pruneExpiredEntries();

      expect(service.get('expired1')).toBeNull();
      expect(service.get('expired2')).toBeNull();
      expect(service.get('valid')).toBe('val3');
    });
  });
});

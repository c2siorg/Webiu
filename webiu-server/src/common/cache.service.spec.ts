import { CacheService } from './cache.service';

function mockConfig(ttl?: string) {
  return { get: jest.fn().mockReturnValue(ttl) } as any;
}

describe('CacheService', () => {
  let service: CacheService;

  beforeEach(() => {
    service = new CacheService(mockConfig());
  });

  it('should store and retrieve values', async () => {
    await service.set('key', 'value', 60);
    expect(await service.get('key')).toBe('value');
  });

  it('should return null for missing keys', async () => {
    expect(await service.get('nonexistent')).toBeNull();
  });

  it('should return null for expired entries', async () => {
    jest.useFakeTimers();
    jest.setSystemTime(0);
    await service.set('key', 'value', 1);
    expect(await service.get('key')).toBe('value');

    jest.advanceTimersByTime(1100);
    expect(await service.get('key')).toBeNull();

    jest.useRealTimers();
  });

  it('should delete a specific key', async () => {
    await service.set('key', 'value', 60);
    await service.delete('key');
    expect(await service.get('key')).toBeNull();
  });

  it('has() should return true even for falsy cached values', async () => {
    await service.set('zero', 0 as unknown, 60);
    await service.set('empty', [], 60);
    await service.set('falsy', false as unknown, 60);
    expect(await service.has('zero')).toBe(true);
    expect(await service.has('empty')).toBe(true);
    expect(await service.has('falsy')).toBe(true);
    expect(await service.has('nonexistent')).toBe(false);
  });

  it('should clear all entries', async () => {
    await service.set('key1', 'value1', 60);
    await service.set('key2', 'value2', 60);
    await service.clear();
    expect(await service.get('key1')).toBeNull();
    expect(await service.get('key2')).toBeNull();
  });

  it('should handle complex objects', async () => {
    const data = { repos: [{ name: 'repo1' }], count: 5 };
    await service.set('complex', data, 60);
    expect(await service.get('complex')).toEqual(data);
  });

  describe('TTL configuration', () => {
    beforeEach(() => {
      jest.useFakeTimers();
      jest.setSystemTime(0);
    });
    afterEach(() => jest.useRealTimers());

    it('should use CACHE_TTL_SECONDS from config as default TTL', async () => {
      const s = new CacheService(mockConfig('60'));

      await s.set('key', 'value');
      jest.advanceTimersByTime(59_000);
      expect(await s.get('key')).toBe('value');

      await s.set('key2', 'value2');
      jest.advanceTimersByTime(61_000);
      expect(await s.get('key2')).toBeNull();
    });

    it('should fall back to 300s when CACHE_TTL_SECONDS is missing', async () => {
      const s = new CacheService(mockConfig(undefined));
      await s.set('key', 'value');
      jest.advanceTimersByTime(301_000);
      expect(await s.get('key')).toBeNull();
    });

    it('should fall back to 300s when CACHE_TTL_SECONDS is invalid (NaN)', async () => {
      const s = new CacheService(mockConfig('abc'));
      await s.set('key', 'value');
      jest.advanceTimersByTime(301_000);
      expect(await s.get('key')).toBeNull();
    });

    it('should fall back to 300s when CACHE_TTL_SECONDS is zero or negative', async () => {
      const s = new CacheService(mockConfig('0'));
      await s.set('key', 'value');
      jest.advanceTimersByTime(301_000);
      expect(await s.get('key')).toBeNull();
    });

    it('should use defaultTtl when set() is called without explicit ttlSeconds', async () => {
      const s = new CacheService(mockConfig('120'));

      await s.set('key', 'value');
      jest.advanceTimersByTime(119_000);
      expect(await s.get('key')).toBe('value');

      await s.set('key2', 'value2');
      jest.advanceTimersByTime(121_000);
      expect(await s.get('key2')).toBeNull();
    });
  });

  describe('getEtag()', () => {
    beforeEach(() => {
      jest.useFakeTimers();
      jest.setSystemTime(0);
    });
    afterEach(() => jest.useRealTimers());

    it('should return the etag stored alongside data', async () => {
      await service.set('key', 'value', 60, '"abc123"');
      expect(await service.getEtag('key')).toBe('"abc123"');
    });

    it('should return undefined when no etag was stored', async () => {
      await service.set('key', 'value', 60);
      expect(await service.getEtag('key')).toBeUndefined();
    });

    it('should return undefined for a missing key', async () => {
      expect(await service.getEtag('nonexistent')).toBeUndefined();
    });

    it('should return undefined and evict an expired entry', async () => {
      await service.set('key', 'value', 1, '"etag"');
      jest.advanceTimersByTime(1100);
      expect(await service.getEtag('key')).toBeUndefined();
      expect(await service.get('key')).toBeNull();
    });

    it('should not affect data retrieval when etag is present', async () => {
      await service.set('key', { count: 42 }, 60, '"xyz"');
      expect(await service.get<{ count: number }>('key')).toEqual({
        count: 42,
      });
      expect(await service.getEtag('key')).toBe('"xyz"');
    });
  });

  describe('refresh()', () => {
    beforeEach(() => {
      jest.useFakeTimers();
      jest.setSystemTime(0);
    });
    afterEach(() => jest.useRealTimers());

    it('should return true and extend the TTL of a live entry', async () => {
      await service.set('key', 'value', 60);

      jest.advanceTimersByTime(30_000);
      expect(await service.refresh('key', 120)).toBe(true);

      jest.advanceTimersByTime(100_000);
      expect(await service.get('key')).toBe('value');

      jest.advanceTimersByTime(21_000);
      expect(await service.get('key')).toBeNull();
    });

    it('should return false for a missing key', async () => {
      expect(await service.refresh('nonexistent', 60)).toBe(false);
    });

    it('should return false and evict an already-expired entry', async () => {
      await service.set('key', 'value', 1);
      jest.advanceTimersByTime(1100);
      expect(await service.refresh('key', 60)).toBe(false);
      expect(await service.get('key')).toBeNull();
    });

    it('should preserve data and etag after refresh', async () => {
      await service.set('key', { stars: 10 }, 60, '"etag-v1"');
      await service.refresh('key', 120);
      expect(await service.get<{ stars: number }>('key')).toEqual({
        stars: 10,
      });
      expect(await service.getEtag('key')).toBe('"etag-v1"');
    });
  });
});

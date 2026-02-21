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

  it('should return null for expired entries', async () => {
    service.set('key', 'value', 1); // expires in 1 second
    expect(service.get('key')).toBe('value');

    // Wait for expiry
    await new Promise((resolve) => setTimeout(resolve, 1100));
    expect(service.get('key')).toBeNull();
  });

  it('should delete a specific key', () => {
    service.set('key', 'value', 60);
    service.delete('key');
    expect(service.get('key')).toBeNull();
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
    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('should use CACHE_TTL_SECONDS from config as default TTL', () => {
      const now = 1_000_000;
      jest
        .spyOn(Date, 'now')
        .mockReturnValueOnce(now)
        .mockReturnValueOnce(now + 59_000)
        .mockReturnValueOnce(now)
        .mockReturnValueOnce(now + 61_000);

      const s = new CacheService(mockConfig('60'));
      s.set('key', 'value');
      expect(s.get('key')).toBe('value');

      s.set('key2', 'value2');
      expect(s.get('key2')).toBeNull();
    });

    it('should fall back to 300s when CACHE_TTL_SECONDS is missing', () => {
      const now = 1_000_000;
      jest
        .spyOn(Date, 'now')
        .mockReturnValueOnce(now)
        .mockReturnValueOnce(now + 301_000);

      const s = new CacheService(mockConfig(undefined));
      s.set('key', 'value');
      expect(s.get('key')).toBeNull();
    });

    it('should fall back to 300s when CACHE_TTL_SECONDS is invalid (NaN)', () => {
      const now = 1_000_000;
      jest
        .spyOn(Date, 'now')
        .mockReturnValueOnce(now)
        .mockReturnValueOnce(now + 301_000);

      const s = new CacheService(mockConfig('abc'));
      s.set('key', 'value');
      expect(s.get('key')).toBeNull();
    });

    it('should fall back to 300s when CACHE_TTL_SECONDS is zero or negative', () => {
      const now = 1_000_000;
      jest
        .spyOn(Date, 'now')
        .mockReturnValueOnce(now)
        .mockReturnValueOnce(now + 301_000);

      const s = new CacheService(mockConfig('0'));
      s.set('key', 'value');
      expect(s.get('key')).toBeNull();
    });

    it('should use defaultTtl when set() is called without explicit ttlSeconds', () => {
      const now = 1_000_000;
      jest
        .spyOn(Date, 'now')
        .mockReturnValueOnce(now)
        .mockReturnValueOnce(now + 119_000)
        .mockReturnValueOnce(now)
        .mockReturnValueOnce(now + 121_000);

      const s = new CacheService(mockConfig('120'));
      s.set('key', 'value');
      expect(s.get('key')).toBe('value');

      s.set('key2', 'value2');
      expect(s.get('key2')).toBeNull();
    });
  });
});

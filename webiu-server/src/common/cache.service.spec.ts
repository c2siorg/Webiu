import { CacheService } from './cache.service';
import { CacheKey } from './cache.types';

function mockConfig(ttl?: string) {
  return { get: jest.fn().mockReturnValue(ttl) } as any;
}

describe('CacheService', () => {
  let service: CacheService;

  beforeEach(() => {
    service = new CacheService(mockConfig());
  });

  const validKey: CacheKey = 'user_social:test';
  const validValue = { followers: 10, following: 5 };

  const validKey2: CacheKey = 'all_contributors';
  const validValue2 = [
    { login: 'test', contributions: 1, repos: [], avatar_url: '' },
  ];

  const nonexistentKey: CacheKey = 'user_social:missing';

  it('should store and retrieve values', () => {
    service.set(validKey, validValue, 60);
    expect(service.get(validKey)).toEqual(validValue);
  });

  it('should return null for missing keys', () => {
    expect(service.get(nonexistentKey)).toBeNull();
  });

  it('should return null for expired entries', async () => {
    service.set(validKey, validValue, 1); // expires in 1 second
    expect(service.get(validKey)).toEqual(validValue);

    // Wait for expiry
    await new Promise((resolve) => setTimeout(resolve, 1100));
    expect(service.get(validKey)).toBeNull();
  });

  it('should delete a specific key', () => {
    service.set(validKey, validValue, 60);
    service.delete(validKey);
    expect(service.get(validKey)).toBeNull();
  });

  it('should clear all entries', () => {
    service.set(validKey, validValue, 60);
    service.set(validKey2, validValue2, 60);
    service.clear();
    expect(service.get(validKey)).toBeNull();
    expect(service.get(validKey2)).toBeNull();
  });

  it('should handle complex objects', () => {
    const data = [
      {
        login: 'user1',
        contributions: 10,
        repos: ['repo1'],
        avatar_url: 'url',
      },
    ];
    service.set('all_contributors', data, 60);
    expect(service.get('all_contributors')).toEqual(data);
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
      s.set(validKey, validValue);
      expect(s.get(validKey)).toEqual(validValue);

      s.set(validKey2, validValue2);
      expect(s.get(validKey2)).toBeNull();
    });

    it('should fall back to 300s when CACHE_TTL_SECONDS is missing', () => {
      const now = 1_000_000;
      jest
        .spyOn(Date, 'now')
        .mockReturnValueOnce(now)
        .mockReturnValueOnce(now + 301_000);

      const s = new CacheService(mockConfig(undefined));
      s.set(validKey, validValue);
      expect(s.get(validKey)).toBeNull();
    });

    it('should fall back to 300s when CACHE_TTL_SECONDS is invalid (NaN)', () => {
      const now = 1_000_000;
      jest
        .spyOn(Date, 'now')
        .mockReturnValueOnce(now)
        .mockReturnValueOnce(now + 301_000);

      const s = new CacheService(mockConfig('abc'));
      s.set(validKey, validValue);
      expect(s.get(validKey)).toBeNull();
    });

    it('should fall back to 300s when CACHE_TTL_SECONDS is zero or negative', () => {
      const now = 1_000_000;
      jest
        .spyOn(Date, 'now')
        .mockReturnValueOnce(now)
        .mockReturnValueOnce(now + 301_000);

      const s = new CacheService(mockConfig('0'));
      s.set(validKey, validValue);
      expect(s.get(validKey)).toBeNull();
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
      s.set(validKey, validValue);
      expect(s.get(validKey)).toEqual(validValue);

      s.set(validKey2, validValue2);
      expect(s.get(validKey2)).toBeNull();
    });
  });
});

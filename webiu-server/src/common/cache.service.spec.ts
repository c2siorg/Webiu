import { CacheService } from './cache.service';

describe('CacheService', () => {
  let service: CacheService;

  beforeEach(() => {
    service = new CacheService();
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
});

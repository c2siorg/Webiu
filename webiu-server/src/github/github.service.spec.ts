import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { GithubService } from './github.service';
import { CacheService } from '../common/cache.service';
import axios, { AxiosError } from 'axios';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

function createAxiosError(message: string, status: number): AxiosError {
  const err = Object.create(AxiosError.prototype) as AxiosError;
  err.message = message;
  err.name = 'AxiosError';
  err.response = {
    status,
    data: {},
    statusText: '',
    headers: {},
    config: {},
  } as any;
  err.isAxiosError = true;
  return err;
}

describe('GithubService', () => {
  let service: GithubService;
  let cacheService: CacheService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GithubService,
        CacheService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              if (key === 'GITHUB_ACCESS_TOKEN') return 'test-token';
              return null;
            }),
          },
        },
      ],
    }).compile();

    service = module.get<GithubService>(GithubService);
    cacheService = module.get<CacheService>(CacheService);
  });

  afterEach(() => {
    jest.clearAllMocks();
    cacheService.clear();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('org', () => {
    it('should return the organization name', () => {
      expect(service.org).toBe('c2siorg');
    });
  });

  describe('getOrgRepos', () => {
    it('should fetch repos and return data (ETag path: second call sends If-None-Match and handles 304)', async () => {
      // First call → 200 with ETag
      mockedAxios.get.mockResolvedValueOnce({
        status: 200,
        data: [{ name: 'repo1' }, { name: 'repo2' }],
        headers: { etag: '"v1"' },
      } as any);
      // Second call → 304 (GitHub says "not modified")
      mockedAxios.get.mockResolvedValueOnce({
        status: 304,
        data: undefined,
        headers: {},
      } as any);

      const result = await service.getOrgRepos();
      expect(result).toHaveLength(2);

      // With ETag caching, second call still hits network (sends If-None-Match).
      // GitHub replies 304 → cached data is returned.
      const result2 = await service.getOrgRepos();
      expect(result2).toHaveLength(2);
      expect(mockedAxios.get).toHaveBeenCalledTimes(2);
    });

    it('should return a single-page result (no-args path uses one URL, not fetchAllPages)', async () => {
      const oneHundredRepos = Array(100).fill({ name: 'repo' });
      mockedAxios.get.mockResolvedValueOnce({
        status: 200,
        data: oneHundredRepos,
        headers: { etag: '"v1"' },
      } as any);

      const result = await service.getOrgRepos();
      // Returns whatever the single ETag-aware request returns.
      expect(result).toHaveLength(100);
      expect(mockedAxios.get).toHaveBeenCalledTimes(1);
    });

    it('should propagate errors', async () => {
      mockedAxios.get.mockRejectedValueOnce(new Error('API error'));
      await expect(service.getOrgRepos()).rejects.toThrow('API error');
    });

    it('200: stores etag in cache', async () => {
      mockedAxios.get.mockResolvedValueOnce({
        status: 200,
        data: [{ name: 'repo1' }],
        headers: { etag: '"v1"' },
      } as any);

      const result = await service.getOrgRepos();
      expect(result).toEqual([{ name: 'repo1' }]);
      expect(cacheService.getEtag('org_repos_c2siorg')).toBe('"v1"');
    });

    it('304: sends If-None-Match, returns cached data and refreshes TTL', async () => {
      cacheService.set('org_repos_c2siorg', [{ name: 'cached' }], 300, '"v1"');

      const refreshSpy = jest.spyOn(cacheService, 'refresh');
      const setSpy = jest.spyOn(cacheService, 'set');

      mockedAxios.get.mockResolvedValueOnce({
        status: 304,
        data: undefined,
        headers: {},
      } as any);

      const result = await service.getOrgRepos();
      expect(result).toEqual([{ name: 'cached' }]);
      expect(refreshSpy).toHaveBeenCalledWith('org_repos_c2siorg', expect.any(Number));
      expect(setSpy).not.toHaveBeenCalled();

      const config = mockedAxios.get.mock.calls[0][1] as any;
      expect(config.headers['If-None-Match']).toBe('"v1"');
    });

    it('304 with missing cache: falls back to fresh GET and stores result', async () => {
      mockedAxios.get
        .mockResolvedValueOnce({ status: 304, data: undefined, headers: {} } as any)
        .mockResolvedValueOnce({
          status: 200,
          data: [{ name: 'fresh' }],
          headers: { etag: '"v2"' },
        } as any);

      const result = await service.getOrgRepos();
      expect(result).toEqual([{ name: 'fresh' }]);
      expect(cacheService.getEtag('org_repos_c2siorg')).toBe('"v2"');
      expect(mockedAxios.get).toHaveBeenCalledTimes(2);
    });
  });

  describe('getRepoPulls', () => {
    it('should fetch and cache pull requests', async () => {
      mockedAxios.get.mockResolvedValueOnce({
        data: [{ id: 1, title: 'PR 1' }],
      });

      const result = await service.getRepoPulls('repo1');
      expect(result).toEqual([{ id: 1, title: 'PR 1' }]);

      // Cached
      await service.getRepoPulls('repo1');
      expect(mockedAxios.get).toHaveBeenCalledTimes(1);
    });
  });

  describe('getRepoIssues', () => {
    it('should fetch and cache issues', async () => {
      mockedAxios.get.mockResolvedValueOnce({
        data: [{ id: 1, title: 'Issue 1' }],
      });

      const result = await service.getRepoIssues('c2siorg', 'repo1');
      expect(result).toEqual([{ id: 1, title: 'Issue 1' }]);

      // Cached
      await service.getRepoIssues('c2siorg', 'repo1');
      expect(mockedAxios.get).toHaveBeenCalledTimes(1);
    });
  });

  describe('getRepoContributors', () => {
    it('should fetch and cache contributors', async () => {
      mockedAxios.get.mockResolvedValueOnce({
        data: [{ login: 'user1', contributions: 10, avatar_url: 'url' }],
      });

      const result = await service.getRepoContributors('c2siorg', 'repo1');
      expect(result).toHaveLength(1);

      // Cached
      await service.getRepoContributors('c2siorg', 'repo1');
      expect(mockedAxios.get).toHaveBeenCalledTimes(1);
    });

    it('should return empty array on error', async () => {
      mockedAxios.get.mockRejectedValue(new Error('API error'));
      const result = await service.getRepoContributors('c2siorg', 'repo1');
      expect(result).toEqual([]);
    });
  });

  describe('getRepo', () => {
    it('should fetch and cache a single repository', async () => {
      mockedAxios.get.mockResolvedValueOnce({
        data: { name: 'Webiu', full_name: 'c2siorg/Webiu' },
      });

      const result = await service.getRepo('Webiu');
      expect(result).toEqual({ name: 'Webiu', full_name: 'c2siorg/Webiu' });

      const result2 = await service.getRepo('Webiu');
      expect(result2).toEqual({ name: 'Webiu', full_name: 'c2siorg/Webiu' });
      expect(mockedAxios.get).toHaveBeenCalledTimes(1);
    });

    it('should return null when repository is not found (404)', async () => {
      mockedAxios.get.mockRejectedValueOnce(createAxiosError('Not Found', 404));

      const result = await service.getRepo('nonexistent');
      expect(result).toBeNull();
    });

    it('should rethrow non-404 errors', async () => {
      mockedAxios.get.mockRejectedValueOnce(
        createAxiosError('Server Error', 500),
      );

      await expect(service.getRepo('Webiu')).rejects.toMatchObject({
        message: 'Server Error',
      });
    });
  });

  describe('getRepoLanguages', () => {
    it('should fetch and cache language breakdown', async () => {
      mockedAxios.get.mockResolvedValueOnce({
        data: { TypeScript: 50000, JavaScript: 30000, HTML: 20000 },
      });

      const result = await service.getRepoLanguages('Webiu');
      expect(result).toEqual({
        TypeScript: 50000,
        JavaScript: 30000,
        HTML: 20000,
      });

      const result2 = await service.getRepoLanguages('Webiu');
      expect(result2).toEqual({
        TypeScript: 50000,
        JavaScript: 30000,
        HTML: 20000,
      });
      expect(mockedAxios.get).toHaveBeenCalledTimes(1);
    });

    it('should return empty object on error', async () => {
      mockedAxios.get.mockRejectedValueOnce(new Error('API error'));

      const result = await service.getRepoLanguages('Webiu');
      expect(result).toEqual({});
    });
  });

  describe('searchUserIssues', () => {
    it('should fetch and cache user issues', async () => {
      mockedAxios.get.mockResolvedValueOnce({
        data: { items: [{ id: 1 }] },
      });

      const result = await service.searchUserIssues('testuser');
      expect(result).toHaveLength(1);

      // Cached
      await service.searchUserIssues('testuser');
      expect(mockedAxios.get).toHaveBeenCalledTimes(1);
    });

    it('should return empty array when no results', async () => {
      mockedAxios.get.mockResolvedValueOnce({ data: { items: [] } });
      const result = await service.searchUserIssues('testuser');
      expect(result).toEqual([]);
    });
  });

  describe('searchUserPullRequests', () => {
    it('should fetch and cache user PRs', async () => {
      mockedAxios.get.mockResolvedValueOnce({
        data: { items: [{ id: 1, title: 'PR' }] },
      });

      const result = await service.searchUserPullRequests('testuser');
      expect(result).toEqual([{ id: 1, title: 'PR' }]);

      // Cached
      await service.searchUserPullRequests('testuser');
      expect(mockedAxios.get).toHaveBeenCalledTimes(1);
    });
  });

  describe('getUserInfo', () => {
    it('should fetch user info with provided access token', async () => {
      mockedAxios.get.mockResolvedValue({ data: { login: 'testuser' } });

      const result = await service.getUserInfo('user-access-token');
      expect(result).toEqual({ login: 'testuser' });
      expect(mockedAxios.get).toHaveBeenCalledWith(
        'https://api.github.com/user',
        { headers: { Authorization: 'Bearer user-access-token' } },
      );
    });
  });

  describe('exchangeGithubCode', () => {
    it('should exchange authorization code for access token', async () => {
      mockedAxios.post.mockResolvedValue({
        data: { access_token: 'gh-token' },
      });

      const result = await service.exchangeGithubCode(
        'client-id',
        'client-secret',
        'auth-code',
        'http://redirect',
      );
      expect(result).toEqual({ access_token: 'gh-token' });
    });
  });

  describe('getUserFollowersAndFollowing', () => {
    it('should use the user profile endpoint to return correct follower/following counts and cache them', async () => {
      mockedAxios.get.mockResolvedValueOnce({
        data: { followers: 123, following: 456 },
      });

      const result = await service.getUserFollowersAndFollowing('TestUser');
      expect(result).toEqual({ followers: 123, following: 456 });

      // ✅ should call /users/:username (not /followers or /following list endpoints)
      expect(mockedAxios.get).toHaveBeenCalledWith(
        'https://api.github.com/users/TestUser',
        { headers: { Authorization: 'token test-token' } },
      );

      // Cached: second call should not hit axios again
      const result2 = await service.getUserFollowersAndFollowing('TestUser');
      expect(result2).toEqual({ followers: 123, following: 456 });
      expect(mockedAxios.get).toHaveBeenCalledTimes(1);
    });
  });

  // ─────────────────────────────────────────────────────────────
  // ETag conditional-request helper (tested via getOrgRepos paginated)
  // ─────────────────────────────────────────────────────────────
  describe('getWithEtagCache (via getOrgRepos paginated)', () => {
    const REPOS = [{ name: 'Webiu' }, { name: 'SemViz' }];

    it('200: stores data + etag and returns data', async () => {
      const setSpy = jest.spyOn(cacheService, 'set');

      mockedAxios.get.mockResolvedValueOnce({
        status: 200,
        data: REPOS,
        headers: { etag: '"v1-etag"' },
      });

      const result = await service.getOrgRepos(1, 30);

      expect(result).toEqual(REPOS);
      expect(setSpy).toHaveBeenCalledWith(
        'org_repos_c2siorg_p1_pp30',
        REPOS,
        300,          // CACHE_TTL constant
        '"v1-etag"',
      );
      // Only one network call
      expect(mockedAxios.get).toHaveBeenCalledTimes(1);
      // Request included no If-None-Match (cache was empty)
      expect(mockedAxios.get).toHaveBeenCalledWith(
        'https://api.github.com/orgs/c2siorg/repos?per_page=30&page=1',
        expect.objectContaining({
          headers: expect.not.objectContaining({ 'If-None-Match': expect.anything() }),
          validateStatus: expect.any(Function),
        }),
      );
    });

    it('304: extends TTL via refresh() and returns cached data without overwriting', async () => {
      // Pre-populate cache with data + etag
      cacheService.set('org_repos_c2siorg_p1_pp30', REPOS, 300, '"v1-etag"');

      const setSpy = jest.spyOn(cacheService, 'set');
      const refreshSpy = jest.spyOn(cacheService, 'refresh');

      mockedAxios.get.mockResolvedValueOnce({
        status: 304,
        data: null,
        headers: {},
      });

      const result = await service.getOrgRepos(1, 30);

      expect(result).toEqual(REPOS);
      // TTL extended
      expect(refreshSpy).toHaveBeenCalledWith('org_repos_c2siorg_p1_pp30', 300);
      // Data must NOT be overwritten
      expect(setSpy).not.toHaveBeenCalled();
      // Only one network call
      expect(mockedAxios.get).toHaveBeenCalledTimes(1);
      // Request included If-None-Match
      expect(mockedAxios.get).toHaveBeenCalledWith(
        'https://api.github.com/orgs/c2siorg/repos?per_page=30&page=1',
        expect.objectContaining({
          headers: expect.objectContaining({ 'If-None-Match': '"v1-etag"' }),
          validateStatus: expect.any(Function),
        }),
      );
    });

    it('304 with missing cache (edge case): fetches fresh and stores result', async () => {
      // No cache — 304 arrives unexpectedly
      mockedAxios.get
        .mockResolvedValueOnce({ status: 304, data: null, headers: {} })   // ETag call → 304
        .mockResolvedValueOnce({ status: 200, data: REPOS, headers: { etag: '"v2-etag"' } }); // fallback

      const setSpy = jest.spyOn(cacheService, 'set');

      const result = await service.getOrgRepos(1, 30);

      expect(result).toEqual(REPOS);
      expect(setSpy).toHaveBeenCalledWith(
        'org_repos_c2siorg_p1_pp30',
        REPOS,
        300,
        '"v2-etag"',
      );
      expect(mockedAxios.get).toHaveBeenCalledTimes(2);
    });
  });
});

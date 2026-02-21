import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { GithubService } from './github.service';
import { CacheService } from '../common/cache.service';
import axios from 'axios';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

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
    it('should fetch repos and cache them', async () => {
      mockedAxios.get.mockResolvedValueOnce({
        data: [{ name: 'repo1' }, { name: 'repo2' }],
      });

      const result = await service.getOrgRepos();
      expect(result).toHaveLength(2);

      // Second call should use cache (no extra axios call)
      const result2 = await service.getOrgRepos();
      expect(result2).toHaveLength(2);
      expect(mockedAxios.get).toHaveBeenCalledTimes(1);
    });

    it('should paginate through all pages', async () => {
      mockedAxios.get
        .mockResolvedValueOnce({ data: Array(100).fill({ name: 'repo' }) })
        .mockResolvedValueOnce({ data: [{ name: 'repo101' }] });

      const result = await service.getOrgRepos();
      expect(result).toHaveLength(101);
      expect(mockedAxios.get).toHaveBeenCalledTimes(2);
    });

    it('should propagate errors', async () => {
      mockedAxios.get.mockRejectedValue(new Error('API error'));
      await expect(service.getOrgRepos()).rejects.toThrow('API error');
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

  describe('getRepoLanguages', () => {
    it('should fetch and cache repo languages', async () => {
      mockedAxios.get.mockResolvedValueOnce({
        data: { TypeScript: 12345, JavaScript: 6789 },
      });

      const result = await service.getRepoLanguages('repo1');
      expect(result).toEqual(['TypeScript', 'JavaScript']);

      // Cached
      await service.getRepoLanguages('repo1');
      expect(mockedAxios.get).toHaveBeenCalledTimes(1);
    });

    it('should return empty array when repo has no languages', async () => {
      mockedAxios.get.mockResolvedValueOnce({ data: {} });
      const result = await service.getRepoLanguages('repo1');
      expect(result).toEqual([]);
    });

    it('should propagate errors', async () => {
      mockedAxios.get.mockRejectedValue(new Error('API error'));
      await expect(service.getRepoLanguages('repo1')).rejects.toThrow(
        'API error',
      );
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

    it('should return null on error', async () => {
      mockedAxios.get.mockRejectedValue(new Error('API error'));
      const result = await service.getRepoContributors('c2siorg', 'repo1');
      expect(result).toBeNull();
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
});

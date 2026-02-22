import { Test, TestingModule } from '@nestjs/testing';
import { InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { ContributorService } from './contributor.service';
import { GithubService } from '../github/github.service';

describe('ContributorService', () => {
  let service: ContributorService;
  let _cacheManager: Cache;
  let fakeCache: Map<string, any>;

  const mockGithubService = {
    org: 'c2siorg',
    getOrgRepos: jest.fn(),
    getRepoContributors: jest.fn(),
    searchUserIssues: jest.fn(),
    searchUserPullRequests: jest.fn(),
  };

  beforeEach(async () => {
    fakeCache = new Map();
    const mockCacheManager = {
      get: jest.fn((key) => Promise.resolve(fakeCache.get(key))),
      set: jest.fn((key, val) => Promise.resolve(fakeCache.set(key, val))),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ContributorService,
        { provide: CACHE_MANAGER, useValue: mockCacheManager },
        { provide: GithubService, useValue: mockGithubService },
        { provide: ConfigService, useValue: { get: jest.fn() } },
      ],
    }).compile();

    service = module.get<ContributorService>(ContributorService);
    _cacheManager = module.get<Cache>(CACHE_MANAGER);
  });

  afterEach(() => {
    jest.resetAllMocks();
    fakeCache.clear();
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getAllContributors', () => {
    it('should return empty array when no repositories', async () => {
      mockGithubService.getOrgRepos.mockResolvedValue([]);
      const result = await service.getAllContributors();
      expect(result).toEqual([]);
    });

    it('should aggregate contributors across repos', async () => {
      mockGithubService.getOrgRepos.mockResolvedValue([
        { name: 'repo1' },
        { name: 'repo2' },
      ]);
      mockGithubService.getRepoContributors
        .mockResolvedValueOnce([
          { login: 'user1', contributions: 10, avatar_url: 'url1' },
        ])
        .mockResolvedValueOnce([
          { login: 'user1', contributions: 3, avatar_url: 'url1' },
          { login: 'user2', contributions: 5, avatar_url: 'url2' },
        ]);

      const result = (await service.getAllContributors()) as any[];

      expect(result).toHaveLength(2);
      const user1 = result.find((c) => c.login === 'user1');
      expect(user1.contributions).toBe(13);
      expect(user1.repos).toEqual(expect.arrayContaining(['repo1', 'repo2']));
    });

    it('should cache the response', async () => {
      mockGithubService.getOrgRepos.mockResolvedValue([{ name: 'repo1' }]);
      mockGithubService.getRepoContributors.mockResolvedValue([]);

      await service.getAllContributors();
      await service.getAllContributors();

      expect(mockGithubService.getOrgRepos).toHaveBeenCalledTimes(1);
    });

    it('should handle repo errors gracefully', async () => {
      const consoleSpy = jest
        .spyOn(console, 'error')
        .mockImplementation(() => {});
      mockGithubService.getOrgRepos.mockResolvedValue([
        { name: 'repo1' },
        { name: 'repo2' },
      ]);
      mockGithubService.getRepoContributors
        .mockRejectedValueOnce(new Error('fail'))
        .mockResolvedValueOnce([
          { login: 'user1', contributions: 5, avatar_url: 'url' },
        ]);

      const result = await service.getAllContributors();
      expect(result).toHaveLength(1);
      consoleSpy.mockRestore();
    });

    it('should throw InternalServerErrorException on total failure', async () => {
      const consoleSpy = jest
        .spyOn(console, 'error')
        .mockImplementation(() => {});
      mockGithubService.getOrgRepos.mockRejectedValue(new Error('fail'));
      await expect(service.getAllContributors()).rejects.toThrow(
        InternalServerErrorException,
      );
      consoleSpy.mockRestore();
    });
  });

  describe('getUserCreatedIssues', () => {
    it('should return issues for a username', async () => {
      mockGithubService.searchUserIssues.mockResolvedValue([{ id: 1 }]);

      const result = await service.getUserCreatedIssues('testuser');
      expect(result).toEqual({ issues: [{ id: 1 }] });
    });

    it('should throw on error', async () => {
      const consoleSpy = jest
        .spyOn(console, 'error')
        .mockImplementation(() => {});
      mockGithubService.searchUserIssues.mockRejectedValue(new Error('fail'));
      await expect(service.getUserCreatedIssues('testuser')).rejects.toThrow(
        InternalServerErrorException,
      );
      consoleSpy.mockRestore();
    });
  });

  describe('getUserCreatedPullRequests', () => {
    it('should return PRs for a username', async () => {
      mockGithubService.searchUserPullRequests.mockResolvedValue([{ id: 1 }]);

      const result = await service.getUserCreatedPullRequests('testuser');
      expect(result).toEqual({ pullRequests: [{ id: 1 }] });
    });

    it('should throw on error', async () => {
      const consoleSpy = jest
        .spyOn(console, 'error')
        .mockImplementation(() => {});
      mockGithubService.searchUserPullRequests.mockRejectedValue(
        new Error('fail'),
      );
      await expect(
        service.getUserCreatedPullRequests('testuser'),
      ).rejects.toThrow(InternalServerErrorException);
      consoleSpy.mockRestore();
    });
  });

  describe('getUserStats', () => {
    it('should return both issues and PRs in parallel', async () => {
      mockGithubService.searchUserIssues.mockResolvedValue([{ id: 1 }]);
      mockGithubService.searchUserPullRequests.mockResolvedValue([{ id: 2 }]);

      const result = await service.getUserStats('testuser');

      expect(result).toEqual({
        issues: [{ id: 1 }],
        pullRequests: [{ id: 2 }],
      });
      expect(mockGithubService.searchUserIssues).toHaveBeenCalledWith(
        'testuser',
      );
      expect(mockGithubService.searchUserPullRequests).toHaveBeenCalledWith(
        'testuser',
      );
    });

    it('should throw on error', async () => {
      const consoleSpy = jest
        .spyOn(console, 'error')
        .mockImplementation(() => {});
      mockGithubService.searchUserIssues.mockRejectedValue(new Error('fail'));
      await expect(service.getUserStats('testuser')).rejects.toThrow(
        InternalServerErrorException,
      );
      consoleSpy.mockRestore();
    });
  });
});

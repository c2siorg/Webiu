import { Test, TestingModule } from '@nestjs/testing';
import { InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ContributorService } from './contributor.service';
import { GithubService } from '../github/github.service';
import { CacheService } from '../common/cache.service';
import { Contributor } from '../database/entities/contributor.entity';

describe('ContributorService', () => {
  let service: ContributorService;
  let cacheService: CacheService;
  let contributorRepositoryMock: any;
  let queryBuilderMock: any;

  const mockGithubService = {
    org: 'c2siorg',
    getOrgRepos: jest.fn(),
    getRepoContributors: jest.fn(),
    searchUserIssues: jest.fn(),
    searchUserPullRequests: jest.fn(),
  };

  beforeEach(async () => {
    queryBuilderMock = {
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      getMany: jest.fn(),
    };

    contributorRepositoryMock = {
      createQueryBuilder: jest.fn().mockReturnValue(queryBuilderMock),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ContributorService,
        CacheService,
        {
          provide: getRepositoryToken(Contributor),
          useValue: contributorRepositoryMock,
        },
        { provide: GithubService, useValue: mockGithubService },
        { provide: ConfigService, useValue: { get: jest.fn() } },
      ],
    }).compile();

    service = module.get<ContributorService>(ContributorService);
    cacheService = module.get<CacheService>(CacheService);
  });

  afterEach(() => {
    jest.clearAllMocks();
    cacheService.clear();
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getAllContributors', () => {
    it('should return empty array when no contributors in database', async () => {
      queryBuilderMock.getMany.mockResolvedValue([]);
      const result = await service.getAllContributors();
      expect(result).toEqual([]);
    });

    it('should aggregate contributors across repos', async () => {
      queryBuilderMock.getMany.mockResolvedValue([
        {
          username: 'user1',
          avatarUrl: 'url1',
          repositoryContributors: [
            {
              contributionCount: 10,
              repository: { name: 'repo1', isActive: true },
            },
            {
              contributionCount: 3,
              repository: { name: 'repo2', isActive: true },
            },
          ],
        },
        {
          username: 'user2',
          avatarUrl: 'url2',
          repositoryContributors: [
            {
              contributionCount: 5,
              repository: { name: 'repo2', isActive: true },
            },
          ],
        },
      ]);

      const result = (await service.getAllContributors()) as any[];

      expect(result).toHaveLength(2);
      const user1 = result.find((c) => c.login === 'user1');
      expect(user1.contributions).toBe(13);
      expect(user1.repos).toEqual(expect.arrayContaining(['repo1', 'repo2']));
      expect(user1.avatar_url).toBe('url1');

      const user2 = result.find((c) => c.login === 'user2');
      expect(user2.contributions).toBe(5);
      expect(user2.repos).toEqual(['repo2']);
    });

    it('should filter out inactive repositories', async () => {
      queryBuilderMock.getMany.mockResolvedValue([
        {
          username: 'user1',
          avatarUrl: 'url1',
          repositoryContributors: [
            {
              contributionCount: 10,
              repository: { name: 'repo1', isActive: true },
            },
            {
              contributionCount: 5,
              repository: { name: 'repo2', isActive: false },
            },
          ],
        },
      ]);

      const result = (await service.getAllContributors()) as any[];
      expect(result).toHaveLength(1);
      expect(result[0].repos).toEqual(['repo1']);
      expect(result[0].contributions).toBe(10);
    });

    it('should cache the response', async () => {
      queryBuilderMock.getMany.mockResolvedValue([]);

      await service.getAllContributors();
      await service.getAllContributors();

      expect(queryBuilderMock.getMany).toHaveBeenCalledTimes(1);
    });

    it('should throw InternalServerErrorException on database query failure', async () => {
      const consoleSpy = jest
        .spyOn(console, 'error')
        .mockImplementation(() => {});
      queryBuilderMock.getMany.mockRejectedValue(new Error('db error'));
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

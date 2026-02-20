import { Test, TestingModule } from '@nestjs/testing';
import { InternalServerErrorException } from '@nestjs/common';
import { ContributorService } from './contributor.service';
import { GithubService } from '../github/github.service';
import { CacheService } from '../common/cache.service';

describe('ContributorService', () => {
  let service: ContributorService;
  let cacheService: CacheService;

  const mockGithubService = {
    org: 'c2siorg',
    getOrgRepos: jest.fn(),
    getRepoContributors: jest.fn(),
    searchUserIssues: jest.fn(),
    searchUserPullRequests: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ContributorService,
        CacheService,
        { provide: GithubService, useValue: mockGithubService },
      ],
    }).compile();

    service = module.get<ContributorService>(ContributorService);
    cacheService = module.get<CacheService>(CacheService);
  });

  afterEach(() => {
    jest.clearAllMocks();
    cacheService.clear();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getAllContributors', () => {
    it('should return paginated empty array when no repositories', async () => {
      mockGithubService.getOrgRepos.mockResolvedValue([]);
      const result = await service.getAllContributors(1, 10);
      expect(result).toEqual({ data: [], total: 0, page: 1, limit: 10 });
    });

    it('should aggregate contributors across repos and paginate', async () => {
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

      const result = (await service.getAllContributors(1, 10)) as any;

      expect(result.total).toBe(2);
      expect(result.data).toHaveLength(2);
      const user1 = result.data.find((c) => c.login === 'user1');
      expect(user1.contributions).toBe(13);
      expect(user1.repos).toEqual(expect.arrayContaining(['repo1', 'repo2']));
    });

    it('should cache the response and still paginate', async () => {
      mockGithubService.getOrgRepos.mockResolvedValue([{ name: 'repo1' }]);
      mockGithubService.getRepoContributors.mockResolvedValue([]);

      await service.getAllContributors(1, 1);
      await service.getAllContributors(1, 1);

      expect(mockGithubService.getOrgRepos).toHaveBeenCalledTimes(1);
    });

    it('should handle repo errors gracefully', async () => {
      mockGithubService.getOrgRepos.mockResolvedValue([
        { name: 'repo1' },
        { name: 'repo2' },
      ]);
      mockGithubService.getRepoContributors
        .mockRejectedValueOnce(new Error('fail'))
        .mockResolvedValueOnce([
          { login: 'user1', contributions: 5, avatar_url: 'url' },
        ]);

      const result = await service.getAllContributors(1, 10);
      expect(result.data).toHaveLength(1);
    });

    it('should throw InternalServerErrorException on total failure', async () => {
      mockGithubService.getOrgRepos.mockRejectedValue(new Error('fail'));
      await expect(service.getAllContributors(1, 10)).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });

  describe('getUserCreatedIssues', () => {
    it('should return issues for a username', async () => {
      mockGithubService.searchUserIssues.mockResolvedValue([{ id: 1 }]);

      const result = await service.getUserCreatedIssues('testuser');
      expect(result).toEqual({ issues: [{ id: 1 }] });
    });

    it('should throw on error', async () => {
      mockGithubService.searchUserIssues.mockRejectedValue(new Error('fail'));
      await expect(service.getUserCreatedIssues('testuser')).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });

  describe('getUserCreatedPullRequests', () => {
    it('should return PRs for a username', async () => {
      mockGithubService.searchUserPullRequests.mockResolvedValue([{ id: 1 }]);

      const result = await service.getUserCreatedPullRequests('testuser');
      expect(result).toEqual({ pullRequests: [{ id: 1 }] });
    });

    it('should throw on error', async () => {
      mockGithubService.searchUserPullRequests.mockRejectedValue(
        new Error('fail'),
      );
      await expect(
        service.getUserCreatedPullRequests('testuser'),
      ).rejects.toThrow(InternalServerErrorException);
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
      mockGithubService.searchUserIssues.mockRejectedValue(new Error('fail'));
      await expect(service.getUserStats('testuser')).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });
});

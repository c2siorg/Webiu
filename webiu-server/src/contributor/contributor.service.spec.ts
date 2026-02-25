import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
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

    it('should throw Error on total failure', async () => {
      const consoleSpy = jest
        .spyOn(console, 'error')
        .mockImplementation(() => {});
      mockGithubService.getOrgRepos.mockRejectedValue(new Error('fail'));

      await expect(service.getAllContributors()).rejects.toThrow(Error);

      consoleSpy.mockRestore();
    });
  });

  describe('getUserCreatedIssues', () => {
    it('should throw on error', async () => {
      const consoleSpy = jest
        .spyOn(console, 'error')
        .mockImplementation(() => {});
      mockGithubService.searchUserIssues.mockRejectedValue(new Error('fail'));

      await expect(service.getUserCreatedIssues('testuser')).rejects.toThrow(
        Error,
      );

      consoleSpy.mockRestore();
    });
  });

  describe('getUserCreatedPullRequests', () => {
    it('should throw on error', async () => {
      const consoleSpy = jest
        .spyOn(console, 'error')
        .mockImplementation(() => {});
      mockGithubService.searchUserPullRequests.mockRejectedValue(
        new Error('fail'),
      );

      await expect(
        service.getUserCreatedPullRequests('testuser'),
      ).rejects.toThrow(Error);

      consoleSpy.mockRestore();
    });
  });

  describe('getUserStats', () => {
    it('should throw on error', async () => {
      const consoleSpy = jest
        .spyOn(console, 'error')
        .mockImplementation(() => {});
      mockGithubService.searchUserIssues.mockRejectedValue(new Error('fail'));

      await expect(service.getUserStats('testuser')).rejects.toThrow(Error);

      consoleSpy.mockRestore();
    });
  });
});

import { Test, TestingModule } from '@nestjs/testing';
import {
  InternalServerErrorException,
  BadRequestException,
} from '@nestjs/common';
import { ProjectService } from './project.service';
import { GithubService } from '../github/github.service';
import { CacheService } from '../common/cache.service';

describe('ProjectService', () => {
  let service: ProjectService;
  let cacheService: CacheService;

  const mockGithubService = {
    getOrgRepos: jest.fn(),
    getRepoPulls: jest.fn(),
    getRepoIssues: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProjectService,
        CacheService,
        { provide: GithubService, useValue: mockGithubService },
      ],
    }).compile();

    service = module.get<ProjectService>(ProjectService);
    cacheService = module.get<CacheService>(CacheService);
  });

  afterEach(() => {
    jest.clearAllMocks();
    cacheService.clear();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getAllProjects', () => {
    it('should return { repositories } with pull request counts using native pagination', async () => {
      mockGithubService.getOrgRepos.mockResolvedValue([
        { name: 'repo1' },
        { name: 'repo2' },
      ]);
      mockGithubService.getRepoPulls
        .mockResolvedValueOnce([{ id: 1 }, { id: 2 }])
        .mockResolvedValueOnce([{ id: 3 }]);

      const result = await service.getAllProjects(1, 10);

      expect(result.repositories).toHaveLength(2);
      expect(result.repositories[0].pull_requests).toBe(2);
      expect(result.repositories[1].pull_requests).toBe(1);
      expect(mockGithubService.getOrgRepos).toHaveBeenCalledWith(1, 10);
    });

    it('should cache the response per page/limit', async () => {
      mockGithubService.getOrgRepos.mockResolvedValue([{ name: 'repo1' }]);
      mockGithubService.getRepoPulls.mockResolvedValue([]);

      await service.getAllProjects(1, 10);
      await service.getAllProjects(1, 10);

      // Only called once due to cache
      expect(mockGithubService.getOrgRepos).toHaveBeenCalledTimes(1);
    });

    it('should handle PR fetch errors gracefully per repo', async () => {
      mockGithubService.getOrgRepos.mockResolvedValue([
        { name: 'repo1' },
        { name: 'repo2' },
      ]);
      mockGithubService.getRepoPulls
        .mockRejectedValueOnce(new Error('fail'))
        .mockResolvedValueOnce([{ id: 1 }]);

      const result = await service.getAllProjects(1, 10);

      expect(result.repositories[0].pull_requests).toBe(0);
      expect(result.repositories[1].pull_requests).toBe(1);
    });

    it('should throw InternalServerErrorException on total failure', async () => {
      mockGithubService.getOrgRepos.mockRejectedValue(new Error('API error'));

      await expect(service.getAllProjects(1, 10)).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });

  describe('getIssuesAndPr', () => {
    it('should return issue and PR counts', async () => {
      mockGithubService.getRepoIssues.mockResolvedValue([
        { id: 1 },
        { id: 2, pull_request: {} },
        { id: 3 },
      ]);

      const result = await service.getIssuesAndPr('c2siorg', 'repo1');
      expect(result).toEqual({ issues: 2, pullRequests: 1 });
    });

    it('should cache the result', async () => {
      mockGithubService.getRepoIssues.mockResolvedValue([]);

      await service.getIssuesAndPr('c2siorg', 'repo1');
      await service.getIssuesAndPr('c2siorg', 'repo1');

      expect(mockGithubService.getRepoIssues).toHaveBeenCalledTimes(1);
    });

    it('should throw BadRequestException when org is missing', async () => {
      await expect(service.getIssuesAndPr('', 'repo1')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException when repo is missing', async () => {
      await expect(service.getIssuesAndPr('c2siorg', '')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw InternalServerErrorException on API error', async () => {
      mockGithubService.getRepoIssues.mockRejectedValue(new Error('fail'));
      await expect(service.getIssuesAndPr('c2siorg', 'repo1')).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });
});

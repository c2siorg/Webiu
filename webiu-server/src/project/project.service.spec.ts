import { Test, TestingModule } from '@nestjs/testing';
import {
  InternalServerErrorException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ProjectService } from './project.service';
import { GithubService } from '../github/github.service';
import { CacheService } from '../common/cache.service';

describe('ProjectService', () => {
  let service: ProjectService;
  let cacheService: CacheService;

  const mockGithubService = {
    org: 'c2siorg',
    getOrgRepos: jest.fn(),
    getRepoPulls: jest.fn(),
    getRepoIssues: jest.fn(),
    getPublicUserProfile: jest.fn(),
    getRepo: jest.fn(),
    getRepoLanguages: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProjectService,
        CacheService,
        { provide: GithubService, useValue: mockGithubService },
        { provide: ConfigService, useValue: { get: jest.fn() } },
      ],
    }).compile();

    service = module.get<ProjectService>(ProjectService);
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

  describe('getAllProjects', () => {
    it('should return { repositories } with pull request counts using native pagination', async () => {
      mockGithubService.getOrgRepos.mockResolvedValue([
        { name: 'repo1' },
        { name: 'repo2' },
      ]);
      mockGithubService.getRepoPulls
        .mockResolvedValueOnce([{ id: 1 }, { id: 2 }])
        .mockResolvedValueOnce([{ id: 3 }]);
      mockGithubService.getPublicUserProfile.mockResolvedValue({
        public_repos: 20,
      });

      const result = await service.getAllProjects(1, 10);

      expect(result.total).toBe(20);
      expect(result.repositories).toHaveLength(2);
      expect(result.repositories[0].pull_requests).toBe(2);
      expect(result.repositories[1].pull_requests).toBe(1);
      expect(mockGithubService.getOrgRepos).toHaveBeenCalledWith(1, 10);
      expect(mockGithubService.getPublicUserProfile).toHaveBeenCalledWith(
        'c2siorg',
      );
    });

    it('should cache the response per page/limit', async () => {
      mockGithubService.getOrgRepos.mockResolvedValue([{ name: 'repo1' }]);
      mockGithubService.getRepoPulls.mockResolvedValue([]);
      mockGithubService.getPublicUserProfile.mockResolvedValue({
        public_repos: 5,
      });

      await service.getAllProjects(1, 10);
      await service.getAllProjects(1, 10);

      // Only called once due to cache
      expect(mockGithubService.getOrgRepos).toHaveBeenCalledTimes(1);
      expect(mockGithubService.getPublicUserProfile).toHaveBeenCalledTimes(1);
    });

    it('should handle PR fetch errors gracefully per repo', async () => {
      mockGithubService.getOrgRepos.mockResolvedValue([
        { name: 'repo1' },
        { name: 'repo2' },
      ]);
      mockGithubService.getRepoPulls
        .mockRejectedValueOnce(new Error('fail'))
        .mockResolvedValueOnce([{ id: 1 }]);
      mockGithubService.getPublicUserProfile.mockResolvedValue({
        public_repos: 10,
      });

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

  describe('getRepoTechStack', () => {
    it('should return languages for the repo', async () => {
      mockGithubService.getRepoLanguages.mockResolvedValue({
        TypeScript: 1000,
        JavaScript: 500,
      });

      const result = await service.getRepoTechStack('repo1');
      expect(result).toEqual({ languages: ['TypeScript', 'JavaScript'] });
    });

    it('should cache the result', async () => {
      mockGithubService.getRepoLanguages.mockResolvedValue({ TypeScript: 1000 });

      await service.getRepoTechStack('repo1');
      await service.getRepoTechStack('repo1');

      expect(mockGithubService.getRepoLanguages).toHaveBeenCalledTimes(1);
    });

    it('should throw BadRequestException when repo is missing', async () => {
      await expect(service.getRepoTechStack('')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw InternalServerErrorException on API error', async () => {
      const consoleSpy = jest
        .spyOn(console, 'error')
        .mockImplementation(() => {});
      mockGithubService.getRepoLanguages.mockRejectedValue(new Error('fail'));

      await expect(service.getRepoTechStack('repo1')).rejects.toThrow(
        InternalServerErrorException,
      );
      consoleSpy.mockRestore();
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

  describe('getProjectByName', () => {
    it('should return enriched project metadata', async () => {
      mockGithubService.getRepo.mockResolvedValue({
        name: 'Webiu',
        stargazers_count: 100,
      });
      mockGithubService.getRepoLanguages.mockResolvedValue({
        TypeScript: 50000,
        HTML: 20000,
      });
      mockGithubService.getRepoPulls.mockResolvedValue([{ id: 1 }, { id: 2 }]);

      const result = await service.getProjectByName('Webiu');

      expect(result).toEqual({
        name: 'Webiu',
        stargazers_count: 100,
        languages: { TypeScript: 50000, HTML: 20000 },
        pull_requests: 2,
      });
    });

    it('should cache the enriched result', async () => {
      mockGithubService.getRepo.mockResolvedValue({ name: 'Webiu' });
      mockGithubService.getRepoLanguages.mockResolvedValue({});
      mockGithubService.getRepoPulls.mockResolvedValue([]);

      await service.getProjectByName('Webiu');
      await service.getProjectByName('Webiu');

      expect(mockGithubService.getRepo).toHaveBeenCalledTimes(1);
    });

    it('should throw BadRequestException for invalid names', async () => {
      await expect(service.getProjectByName('')).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.getProjectByName('repo name!')).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.getProjectByName('../etc')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw NotFoundException when repo is null', async () => {
      mockGithubService.getRepo.mockResolvedValue(null);

      await expect(service.getProjectByName('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should handle PR fetch failure gracefully', async () => {
      mockGithubService.getRepo.mockResolvedValue({ name: 'Webiu' });
      mockGithubService.getRepoLanguages.mockResolvedValue({});
      mockGithubService.getRepoPulls.mockRejectedValue(new Error('fail'));

      const result = (await service.getProjectByName('Webiu')) as any;
      expect(result.pull_requests).toBe(0);
    });

    it('should throw InternalServerErrorException on unexpected errors', async () => {
      mockGithubService.getRepo.mockRejectedValue(new Error('Server error'));

      await expect(service.getProjectByName('Webiu')).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });
});

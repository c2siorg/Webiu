import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
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
    });

    it('should throw Error on total failure', async () => {
      mockGithubService.getOrgRepos.mockRejectedValue(new Error('API error'));

      await expect(service.getAllProjects(1, 10)).rejects.toThrow(Error);
    });
  });

  describe('getIssuesAndPr', () => {
    it('should throw BadRequestException when org is missing', async () => {
      await expect(service.getIssuesAndPr('', 'repo1')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw Error on API error', async () => {
      mockGithubService.getRepoIssues.mockRejectedValue(new Error('fail'));

      await expect(service.getIssuesAndPr('c2siorg', 'repo1')).rejects.toThrow(
        Error,
      );
    });
  });
});

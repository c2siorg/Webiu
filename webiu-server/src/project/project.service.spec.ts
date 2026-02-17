import { Test, TestingModule } from '@nestjs/testing';
import { InternalServerErrorException, BadRequestException } from '@nestjs/common';
import { ProjectService } from './project.service';
import { GithubService } from '../github/github.service';

describe('ProjectService', () => {
  let service: ProjectService;
  let githubService: GithubService;

  const mockGithubService = {
    getOrgRepos: jest.fn(),
    getRepoPulls: jest.fn(),
    getRepoIssues: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProjectService,
        { provide: GithubService, useValue: mockGithubService },
      ],
    }).compile();

    service = module.get<ProjectService>(ProjectService);
    githubService = module.get<GithubService>(GithubService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getAllProjects', () => {
    it('should return repositories with pull request counts', async () => {
      const mockRepos = [
        { name: 'repo1', full_name: 'c2siorg/repo1' },
        { name: 'repo2', full_name: 'c2siorg/repo2' },
      ];
      mockGithubService.getOrgRepos.mockResolvedValue(mockRepos);
      mockGithubService.getRepoPulls
        .mockResolvedValueOnce([{ id: 1 }, { id: 2 }])
        .mockResolvedValueOnce([{ id: 3 }]);

      const result = await service.getAllProjects();

      expect(result).toEqual({
        repositories: [
          { name: 'repo1', full_name: 'c2siorg/repo1', pull_requests: 2 },
          { name: 'repo2', full_name: 'c2siorg/repo2', pull_requests: 1 },
        ],
      });
      expect(mockGithubService.getOrgRepos).toHaveBeenCalledTimes(1);
      expect(mockGithubService.getRepoPulls).toHaveBeenCalledTimes(2);
    });

    it('should return empty repositories when org has no repos', async () => {
      mockGithubService.getOrgRepos.mockResolvedValue([]);

      const result = await service.getAllProjects();

      expect(result).toEqual({ repositories: [] });
    });

    it('should throw InternalServerErrorException on error', async () => {
      mockGithubService.getOrgRepos.mockRejectedValue(new Error('API error'));

      await expect(service.getAllProjects()).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });

  describe('getIssuesAndPr', () => {
    it('should return issue and PR counts', async () => {
      const mockData = [
        { id: 1, title: 'Issue 1' },
        { id: 2, title: 'PR 1', pull_request: {} },
        { id: 3, title: 'Issue 2' },
        { id: 4, title: 'PR 2', pull_request: {} },
        { id: 5, title: 'PR 3', pull_request: {} },
      ];
      mockGithubService.getRepoIssues.mockResolvedValue(mockData);

      const result = await service.getIssuesAndPr('c2siorg', 'repo1');

      expect(result).toEqual({ issues: 2, pullRequests: 3 });
      expect(mockGithubService.getRepoIssues).toHaveBeenCalledWith(
        'c2siorg',
        'repo1',
      );
    });

    it('should return zero counts when repo has no issues or PRs', async () => {
      mockGithubService.getRepoIssues.mockResolvedValue([]);

      const result = await service.getIssuesAndPr('c2siorg', 'repo1');

      expect(result).toEqual({ issues: 0, pullRequests: 0 });
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
      mockGithubService.getRepoIssues.mockRejectedValue(
        new Error('API error'),
      );

      await expect(
        service.getIssuesAndPr('c2siorg', 'repo1'),
      ).rejects.toThrow(InternalServerErrorException);
    });
  });
});
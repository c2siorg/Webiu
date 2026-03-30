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
    getAllOrgReposSorted: jest.fn(),
    getRepoPullCount: jest.fn(),
    getRepoPulls: jest.fn(),
    getRepoIssues: jest.fn(),
    getRepo: jest.fn(),
    getRepoLanguages: jest.fn(),
    getCommitActivity: jest.fn(),
    getLatestRelease: jest.fn(),
    getRepoContributors: jest.fn(),
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

  afterEach(async () => {
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
      mockGithubService.getAllOrgReposSorted.mockResolvedValue([
        { name: 'repo1' },
        { name: 'repo2' },
      ]);
      mockGithubService.getRepoPullCount
        .mockResolvedValueOnce(2)
        .mockResolvedValueOnce(1);

      const result = await service.getAllProjects(1, 10);

      expect(result.total).toBe(2);
      expect(result.repositories).toHaveLength(2);
      expect(result.repositories[0].pull_requests).toBe(2);
      expect(result.repositories[1].pull_requests).toBe(1);
      expect(mockGithubService.getAllOrgReposSorted).toHaveBeenCalledTimes(1);
    });

    it('should cache the response per page/limit', async () => {
      mockGithubService.getAllOrgReposSorted.mockResolvedValue([
        { name: 'repo1' },
      ]);
      mockGithubService.getRepoPullCount.mockResolvedValue(0);

      await service.getAllProjects(1, 10);
      await service.getAllProjects(1, 10);

      // Only called once due to cache
      expect(mockGithubService.getAllOrgReposSorted).toHaveBeenCalledTimes(1);
    });

    it('should handle PR fetch errors gracefully per repo', async () => {
      mockGithubService.getAllOrgReposSorted.mockResolvedValue([
        { name: 'repo1' },
        { name: 'repo2' },
      ]);
      mockGithubService.getRepoPullCount
        .mockRejectedValueOnce(new Error('fail'))
        .mockResolvedValueOnce(1);

      const result = await service.getAllProjects(1, 10);

      expect(result.repositories[0].pull_requests).toBe(0);
      expect(result.repositories[1].pull_requests).toBe(1);
    });

    it('should throw InternalServerErrorException on total failure', async () => {
      mockGithubService.getAllOrgReposSorted.mockRejectedValue(
        new Error('API error'),
      );

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

  describe('getProjectInsights', () => {
    const baseProject = {
      name: 'Webiu',
      stargazers_count: 100,
      open_issues_count: 3,
      size: 20480,
      created_at: new Date(
        Date.now() - 2 * 365 * 24 * 3600 * 1000,
      ).toISOString(),
      pushed_at: new Date(Date.now() - 10 * 24 * 3600 * 1000).toISOString(),
    };

    beforeEach(() => {
      mockGithubService.getRepo.mockResolvedValue(baseProject);
      mockGithubService.getCommitActivity.mockResolvedValue(
        Array(52).fill({ total: 3 }),
      );
      mockGithubService.getLatestRelease.mockResolvedValue({
        published_at: new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString(),
      });
      mockGithubService.getRepoLanguages.mockResolvedValue({
        TypeScript: 80000,
        HTML: 20000,
        SCSS: 10000,
        JavaScript: 5000,
      });
    });

    it('should return badges, stats, commit_activity, and latest_release', async () => {
      const result = (await service.getProjectInsights('Webiu')) as any;

      expect(result).toHaveProperty('badges');
      expect(result).toHaveProperty('stats');
      expect(result).toHaveProperty('commit_activity');
      expect(result).toHaveProperty('latest_release');
    });

    it('should classify a mature active project correctly', async () => {
      const result = (await service.getProjectInsights('Webiu')) as any;

      expect(result.badges.maturity.label).toBe('Mature');
      expect(result.badges.maintenance.label).toBe('Active');
    });

    it('should classify an incubating stale project correctly', async () => {
      mockGithubService.getRepo.mockResolvedValue({
        ...baseProject,
        stargazers_count: 5,
        pushed_at: new Date(Date.now() - 120 * 24 * 3600 * 1000).toISOString(),
        created_at: new Date(Date.now() - 60 * 24 * 3600 * 1000).toISOString(),
      });
      mockGithubService.getCommitActivity.mockResolvedValue([]);

      const result = (await service.getProjectInsights('Webiu')) as any;

      expect(result.badges.maturity.label).toBe('Incubating');
      expect(result.badges.maintenance.label).toBe('Stale');
      expect(result.badges.activity_level.label).toBe('Low');
    });

    it('should label a multi-language repo as Polyglot', async () => {
      const result = (await service.getProjectInsights('Webiu')) as any;
      expect(result.badges.complexity.label).toBe('Polyglot');
    });

    it('should label a single-language repo as Focused', async () => {
      mockGithubService.getRepoLanguages.mockResolvedValue({
        TypeScript: 80000,
      });

      const result = (await service.getProjectInsights('Webiu')) as any;
      expect(result.badges.complexity.label).toBe('Focused');
    });

    it('should cache the result', async () => {
      await service.getProjectInsights('Webiu');
      await service.getProjectInsights('Webiu');

      expect(mockGithubService.getRepo).toHaveBeenCalledTimes(1);
    });

    it('should throw BadRequestException for invalid repo name', async () => {
      await expect(service.getProjectInsights('')).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.getProjectInsights('bad name!')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw NotFoundException when repo does not exist', async () => {
      mockGithubService.getRepo.mockResolvedValue(null);

      await expect(service.getProjectInsights('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw InternalServerErrorException on unexpected API error', async () => {
      mockGithubService.getRepo.mockRejectedValue(new Error('Server error'));

      await expect(service.getProjectInsights('Webiu')).rejects.toThrow(
        InternalServerErrorException,
      );
    });

    it('should handle missing latest release gracefully', async () => {
      mockGithubService.getLatestRelease.mockResolvedValue(null);

      const result = (await service.getProjectInsights('Webiu')) as any;
      expect(result.stats.release_recency).toBe('Rolling');
    });
  });

  describe('getProjectContributors', () => {
    const mockContributors = [
      { login: 'alice', contributions: 20, avatar_url: 'url1' },
      { login: 'bob', contributions: 5, avatar_url: 'url2' },
    ];

    const mockPulls = [
      { user: { login: 'alice' }, state: 'closed', merged_at: '2024-01-01' },
      { user: { login: 'alice' }, state: 'open', merged_at: null },
      { user: { login: 'bob' }, state: 'closed', merged_at: null },
    ];

    const mockIssues = [
      { user: { login: 'alice' } },
      { user: { login: 'alice' } },
      { user: { login: 'bob' }, pull_request: {} },
    ];

    beforeEach(() => {
      mockGithubService.getRepoContributors.mockResolvedValue(mockContributors);
      mockGithubService.getRepoPulls.mockResolvedValue(mockPulls);
      mockGithubService.getRepoIssues.mockResolvedValue(mockIssues);
    });

    it('should return contributors enriched with PR and issue stats', async () => {
      const result = (await service.getProjectContributors('Webiu')) as any[];

      expect(result).toHaveLength(2);

      const alice = result.find((c) => c.login === 'alice');
      expect(alice.merged_prs).toBe(1);
      expect(alice.open_prs).toBe(1);
      expect(alice.closed_prs).toBe(0);
      expect(alice.issues_created).toBe(2);

      const bob = result.find((c) => c.login === 'bob');
      expect(bob.merged_prs).toBe(0);
      expect(bob.closed_prs).toBe(1);
      expect(bob.issues_created).toBe(0);
    });

    it('should exclude pull_request items from issue counts', async () => {
      const result = (await service.getProjectContributors('Webiu')) as any[];
      const bob = result.find((c) => c.login === 'bob');
      // bob's pull_request item should not count as an issue
      expect(bob.issues_created).toBe(0);
    });

    it('should cache the result', async () => {
      await service.getProjectContributors('Webiu');
      await service.getProjectContributors('Webiu');

      expect(mockGithubService.getRepoContributors).toHaveBeenCalledTimes(1);
    });

    it('should throw BadRequestException for invalid repo name', async () => {
      await expect(service.getProjectContributors('')).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.getProjectContributors('../etc')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw InternalServerErrorException on API failure', async () => {
      mockGithubService.getRepoContributors.mockRejectedValue(
        new Error('API error'),
      );

      await expect(service.getProjectContributors('Webiu')).rejects.toThrow(
        InternalServerErrorException,
      );
    });

    it('should handle empty contributor list', async () => {
      mockGithubService.getRepoContributors.mockResolvedValue([]);

      const result = (await service.getProjectContributors('Webiu')) as any[];
      expect(result).toEqual([]);
    });
  });

  describe('searchProjects', () => {
    const allRepos = [
      { name: 'Webiu', description: 'Organization website' },
      { name: 'tensormap', description: 'Deep learning UI' },
      { name: 'RustWorks', description: 'Rust learning resources' },
    ];

    beforeEach(() => {
      mockGithubService.getAllOrgReposSorted.mockResolvedValue(allRepos);
      mockGithubService.getRepoPullCount.mockResolvedValue(0);
    });

    it('should return repos matching name', async () => {
      const result = (await service.searchProjects('webiu', 1, 10)) as any;

      expect(result.total).toBe(1);
      expect(result.repositories[0].name).toBe('Webiu');
    });

    it('should return repos matching description', async () => {
      const result = (await service.searchProjects('learning', 1, 10)) as any;

      expect(result.total).toBe(2);
      const names = result.repositories.map((r: any) => r.name);
      expect(names).toContain('tensormap');
      expect(names).toContain('RustWorks');
    });

    it('should return empty result for no matches', async () => {
      const result = (await service.searchProjects(
        'nonexistent',
        1,
        10,
      )) as any;

      expect(result.total).toBe(0);
      expect(result.repositories).toHaveLength(0);
    });

    it('should paginate results correctly', async () => {
      mockGithubService.getAllOrgReposSorted.mockResolvedValue([
        ...allRepos,
        { name: 'SCoRE', description: 'Rust embedded' },
      ]);

      const result = (await service.searchProjects('rust', 1, 1)) as any;

      expect(result.total).toBe(2);
      expect(result.repositories).toHaveLength(1);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(1);
    });

    it('should cache the result', async () => {
      await service.searchProjects('webiu', 1, 10);
      await service.searchProjects('webiu', 1, 10);

      expect(mockGithubService.getAllOrgReposSorted).toHaveBeenCalledTimes(1);
    });

    it('should throw BadRequestException when query is empty', async () => {
      await expect(service.searchProjects('', 1, 10)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw InternalServerErrorException on API failure', async () => {
      mockGithubService.getAllOrgReposSorted.mockRejectedValue(
        new Error('API error'),
      );

      await expect(service.searchProjects('webiu', 1, 10)).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });
});

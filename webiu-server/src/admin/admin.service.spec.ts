import { Test, TestingModule } from '@nestjs/testing';
import { AdminService } from './admin.service';
import { AuthService } from '../auth/auth.service';
import { ProjectService } from '../project/project.service';
import { ContributorService } from '../contributor/contributor.service';
import { GithubService } from '../github/github.service';

describe('AdminService', () => {
  let service: AdminService;

  const mockAuthService = {
    getUserCount: jest.fn().mockReturnValue(2),
  };

  const mockProjectService = {
    getAllProjects: jest.fn().mockResolvedValue({
      repositories: [
        { name: 'repo-1', pull_requests: 3 },
        { name: 'repo-2', pull_requests: 5 },
      ],
    }),
  };

  const mockContributorService = {
    getAllContributors: jest.fn().mockResolvedValue([
      { login: 'alice' },
      { login: 'bob' },
      { login: 'carol' },
    ]),
  };

  const mockGithubService = {
    searchOrgIssues: jest.fn().mockResolvedValue([
      {
        title: 'Issue A',
        user: { login: 'alice' },
        html_url: 'https://github.com/example/issue-a',
        created_at: '2026-01-01T00:00:00.000Z',
        state: 'open',
      },
    ]),
    searchOrgPullRequests: jest.fn().mockResolvedValue([
      {
        title: 'PR A',
        user: { login: 'bob' },
        html_url: 'https://github.com/example/pr-a',
        created_at: '2026-01-02T00:00:00.000Z',
        state: 'closed',
      },
    ]),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminService,
        { provide: AuthService, useValue: mockAuthService },
        { provide: ProjectService, useValue: mockProjectService },
        { provide: ContributorService, useValue: mockContributorService },
        { provide: GithubService, useValue: mockGithubService },
      ],
    }).compile();

    service = module.get<AdminService>(AdminService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('returns aggregated dashboard stats and activity', async () => {
    const result = await service.getDashboard();

    expect(result.stats).toEqual([
      { label: 'Registered Users', value: 2 },
      { label: 'Repositories', value: 2 },
      { label: 'Contributors', value: 3 },
      { label: 'Pull Requests', value: 8 },
    ]);
    expect(result.recentActivity).toHaveLength(2);
    expect(result.recentActivity[0].type).toBe('pull-request');
    expect(result.recentActivity[1].type).toBe('issue');
  });
});

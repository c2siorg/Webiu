import { Injectable, Logger } from '@nestjs/common';
import { AuthService } from '../auth/auth.service';
import { ContributorService } from '../contributor/contributor.service';
import { GithubService } from '../github/github.service';
import { ProjectService } from '../project/project.service';
import {
  AdminActivityItem,
  AdminDashboardResponse,
} from './dto/admin-dashboard.dto';

@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name);

  constructor(
    private readonly authService: AuthService,
    private readonly projectService: ProjectService,
    private readonly contributorService: ContributorService,
    private readonly githubService: GithubService,
  ) {}

  async getDashboard(): Promise<AdminDashboardResponse> {
    const [projectsResult, contributors, recentIssues, recentPullRequests] =
      await Promise.all([
        this.projectService.getAllProjects(1, 100),
        this.contributorService.getAllContributors(),
        this.safeSearchIssueOrPr('issue'),
        this.safeSearchIssueOrPr('pull-request'),
      ]);

    const repositories = Array.isArray(projectsResult.repositories)
      ? projectsResult.repositories
      : [];
    const contributorsList = Array.isArray(contributors) ? contributors : [];
    const totalPullRequests = repositories.reduce(
      (sum, repo) => sum + (repo.pull_requests || 0),
      0,
    );

    return {
      generatedAt: new Date().toISOString(),
      stats: [
        { label: 'Registered Users', value: this.authService.getUserCount() },
        { label: 'Repositories', value: repositories.length },
        { label: 'Contributors', value: contributorsList.length },
        { label: 'Pull Requests', value: totalPullRequests },
      ],
      recentActivity: this.buildRecentActivity(
        Array.isArray(recentIssues) ? recentIssues : [],
        Array.isArray(recentPullRequests) ? recentPullRequests : [],
      ),
    };
  }

  private async safeSearchIssueOrPr(kind: 'issue' | 'pull-request') {
    try {
      if (kind === 'issue') {
        return await this.githubService.searchOrgIssues();
      }

      return await this.githubService.searchOrgPullRequests();
    } catch (error) {
      this.logger.warn(`Unable to load ${kind} activity: ${error?.message}`);
      return [];
    }
  }

  private buildRecentActivity(
    issues: any[],
    pullRequests: any[],
  ): AdminActivityItem[] {
    const activity: AdminActivityItem[] = [
      ...issues.slice(0, 5).map((issue) => ({
        type: 'issue' as const,
        title: issue.title,
        author: issue.user?.login || 'unknown',
        url: issue.html_url,
        createdAt: issue.created_at,
        state: issue.state,
      })),
      ...pullRequests.slice(0, 5).map((pr) => ({
        type: 'pull-request' as const,
        title: pr.title,
        author: pr.user?.login || 'unknown',
        url: pr.html_url,
        createdAt: pr.created_at,
        state: pr.state,
      })),
    ];

    return activity
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      )
      .slice(0, 10);
  }
}

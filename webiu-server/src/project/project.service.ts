import {
  Injectable,
  InternalServerErrorException,
  BadRequestException,
} from '@nestjs/common';
import { GithubService } from '../github/github.service';
import { CacheService } from '../common/cache.service';

const CACHE_TTL = 300; // 5 minutes

@Injectable()
export class ProjectService {
  constructor(
    private githubService: GithubService,
    private cacheService: CacheService,
  ) {}

  async getAllProjects(page = 1, limit = 10) {
    const cacheKey = `projects_p${page}_pp${limit}`;
    const cached = this.cacheService.get<{ repositories: any[] }>(cacheKey);
    if (cached) return cached;

    try {
      // Use GitHub's native pagination instead of fetching everything
      const repositories = await this.githubService.getOrgRepos(page, limit);

      // Fetch PR counts only for the repos on this page
      const repositoriesWithPRs = await Promise.all(
        repositories.map(async (repo) => {
          try {
            const pulls = await this.githubService.getRepoPulls(repo.name);
            return { ...repo, pull_requests: pulls.length };
          } catch {
            return { ...repo, pull_requests: 0 };
          }
        }),
      );

      const result = { repositories: repositoriesWithPRs };
      this.cacheService.set(cacheKey, result, CACHE_TTL);
      return result;
    } catch (error) {
      console.error(
        'Error fetching repositories or pull requests:',
        error.response ? error.response.data : error.message,
      );
      throw new InternalServerErrorException('Internal server error');
    }
  }

  async getIssuesAndPr(org: string, repo: string) {
    if (!org || !repo) {
      throw new BadRequestException('Organization and repository are required');
    }

    const cacheKey = `issues_pr_count_${org}_${repo}`;
    const cached = this.cacheService.get(cacheKey);
    if (cached) return cached;

    try {
      const data = await this.githubService.getRepoIssues(org, repo);

      const issues = data.filter((item) => !item.pull_request).length;
      const pullRequests = data.filter((item) => item.pull_request).length;

      const result = { issues, pullRequests };
      this.cacheService.set(cacheKey, result, CACHE_TTL);
      return result;
    } catch (error) {
      console.error(
        'Error fetching issues and PRs:',
        error.response?.data || error.message,
      );
      throw new InternalServerErrorException('Failed to fetch issues and PRs');
    }
  }
}

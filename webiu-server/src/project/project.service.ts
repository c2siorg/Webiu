import {
  Injectable,
  Logger,
  InternalServerErrorException,
  BadRequestException,
} from '@nestjs/common';
import { GithubService } from '../github/github.service';
import { CacheService } from '../common/cache.service';

const CACHE_TTL = 300; // 5 minutes

@Injectable()
export class ProjectService {
  private readonly logger = new Logger(ProjectService.name);

  constructor(
    private githubService: GithubService,
    private cacheService: CacheService,
  ) {}

  async getAllProjects(page = 1, limit = 10) {
    const cacheKey = `projects_p${page}_pp${limit}`;
    const cached = this.cacheService.get<{
      total: number;
      page: number;
      limit: number;
      repositories: any[];
    }>(cacheKey);
    if (cached) return cached;

    try {
      
      const repositories = await this.githubService.getOrgRepos(page, limit);

      
      const BATCH_SIZE = 10;
      const repositoriesWithPRs = [];
      for (let i = 0; i < repositories.length; i += BATCH_SIZE) {
        const batch = repositories.slice(i, i + BATCH_SIZE);
        const batchResults = await Promise.all(
          batch.map(async (repo) => {
            try {
              const pulls = await this.githubService.getRepoPulls(repo.name);
              return { ...repo, pull_requests: pulls.length };
            } catch {
              return { ...repo, pull_requests: 0 };
            }
          }),
        );
        repositoriesWithPRs.push(...batchResults);
      }

      
      const orgInfo = await this.githubService.getPublicUserProfile(
        this.githubService.org,
      );
      const total = orgInfo.public_repos || 0;

      const result = {
        total,
        page,
        limit,
        repositories: repositoriesWithPRs,
      };

      this.cacheService.set(cacheKey, result, CACHE_TTL);
      return result;
    } catch (error) {
      this.logger.error(
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
      this.cacheService.set(cacheKey, result);
      return result;
    } catch (error) {
      this.logger.error(
        'Error fetching issues and PRs:',
        error.response?.data || error.message,
      );
      throw new InternalServerErrorException('Failed to fetch issues and PRs');
    }
  }

  async searchProjects(query: string) {
    if (!query) {
      throw new BadRequestException('Search query is required');
    }

    const cacheKey = `projects_search_${query}`;
    const cached = this.cacheService.get<any[]>(cacheKey);
    if (cached) return cached;

    try {
      const repositories = await this.githubService.searchOrgRepos(query);

      
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

      this.cacheService.set(cacheKey, repositoriesWithPRs, CACHE_TTL);

      return {
        total: repositoriesWithPRs.length,
        repositories: repositoriesWithPRs,
      };
    } catch (error) {
      this.logger.error(
        'Error searching repositories:',
        error.response?.data || error.message,
      );
      throw new InternalServerErrorException('Failed to search projects');
    }
  }
}

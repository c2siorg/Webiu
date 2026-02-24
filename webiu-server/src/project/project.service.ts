import {
  Injectable,
  Logger,
  InternalServerErrorException,
  BadRequestException,
  NotFoundException,
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
      // Use GitHub's native pagination instead of fetching everything
      const repositories = await this.githubService.getOrgRepos(page, limit);

      // Fetch PR counts in batches to avoid overwhelming the API
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

      // Get the true total number of public repositories to pass to frontend pagination
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

  /**
   * Retrieves enriched metadata for a single project by name.
   * Directly fetches the individual repository to optimize performance.
   */
  async getProjectByName(name: string) {
    // Validate repository name format (alphanumeric, hyphens, underscores)
    if (!name || !/^[a-zA-Z0-9-_\.]+$/.test(name)) {
      throw new BadRequestException('Invalid project name provided');
    }

    const cacheKey = `project_details_${name}`;
    const cached = this.cacheService.get(cacheKey);
    if (cached) return cached;

    try {
      // Direct fetch of a single repo as requested by maintainers
      const project = await this.githubService.getRepo(name);

      if (!project) {
        throw new NotFoundException(`Project ${name} not found`);
      }

      // Fetch languages and PR counts
      const [languages, pulls] = await Promise.all([
        this.githubService.getRepoLanguages(name),
        this.githubService.getRepoPulls(name).catch(() => []),
      ]);

      const result = {
        ...project,
        languages,
        pull_requests: pulls.length,
      };

      this.cacheService.set(cacheKey, result, CACHE_TTL);
      return result;
    } catch (error) {
      if (error instanceof NotFoundException) throw error;

      if (error.response?.status === 404) {
        throw new NotFoundException(`Project ${name} not found on GitHub`);
      }

      this.logger.error(
        `Error fetching project details for ${name}:`,
        error.message,
      );
      throw new InternalServerErrorException('Failed to fetch project details');
    }
  }
}

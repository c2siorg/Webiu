import {
  Injectable,
  Logger,
  InternalServerErrorException,
} from '@nestjs/common';
import { GithubService } from '../github/github.service';
import { CacheService } from '../common/cache.service';

const CACHE_TTL = 300; // 5 minutes

@Injectable()
export class ContributorService {
  private readonly logger = new Logger(ContributorService.name);

  constructor(
    private githubService: GithubService,
    private cacheService: CacheService,
  ) {}

  async getAllContributors() {
    const cacheKey = 'all_contributors';
    const cached = this.cacheService.get(cacheKey);
    if (cached) return cached;

    try {
      const orgName = this.githubService.org;
      const contributorsMap = new Map();

      const repositories = await this.githubService.getOrgRepos();

      if (repositories.length === 0) {
        return [];
      }

      const BATCH_SIZE = 10;
      for (let i = 0; i < repositories.length; i += BATCH_SIZE) {
        const batch = repositories.slice(i, i + BATCH_SIZE);

        await Promise.all(
          batch.map(async (repo) => {
            const contributors = await this.githubService.getRepoContributors(
              orgName,
              repo.name,
            );
            if (!contributors?.length) return;

            contributors.forEach((contributor) => {
              const login = contributor.login.toLowerCase();

              if (!contributorsMap.has(login)) {
                contributorsMap.set(login, {
                  login: contributor.login,
                  contributions: contributor.contributions,
                  repos: new Set([repo.name]),
                  avatar_url: contributor.avatar_url,
                });
              } else {
                const userData = contributorsMap.get(login);
                userData.contributions += contributor.contributions;
                userData.repos.add(repo.name);
              }
            });
          }),
        );
      }

      const allContributors = Array.from(contributorsMap.values()).map(
        (contributor) => ({
          ...contributor,
          repos: Array.from(contributor.repos),
        }),
      );

      this.cacheService.set(cacheKey, allContributors, CACHE_TTL);
      return allContributors;
    } catch (error) {
      this.logger.error('Error in getAllContributors:', error);
      throw new InternalServerErrorException({
        error: 'Failed to fetch repositories',
        message: error.message,
      });
    }
  }

  async getUserCreatedIssues(username: string) {
    const issues = await this.githubService.searchUserIssues(username);

    if (!issues) {
      throw new InternalServerErrorException(
        'Failed to fetch user-created issues',
      );
    }

    return { issues };
  }

  async getUserCreatedPullRequests(username: string) {
    const pullRequests =
      await this.githubService.searchUserPullRequests(username);

    if (!pullRequests) {
      throw new InternalServerErrorException(
        'Failed to fetch user-created pull requests',
      );
    }

    return { pullRequests };
  }

  /**
   * Combined endpoint: fetches both issues and PRs in parallel.
   * Saves the frontend from making 2 separate requests.
   */
  async getUserStats(username: string) {
    const [issues, pullRequests] = await Promise.all([
      this.githubService.searchUserIssues(username),
      this.githubService.searchUserPullRequests(username),
    ]);

    return {
      issues: issues || [],
      pullRequests: pullRequests || [],
    };
  }

  async getUserFollowersAndFollowing(username: string) {
    const result =
      await this.githubService.getUserFollowersAndFollowing(username);
    return result;
  }
}

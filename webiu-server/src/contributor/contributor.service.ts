import {
  Injectable,
  InternalServerErrorException,
  BadRequestException,
} from '@nestjs/common';
import { GithubService } from '../github/github.service';
import { CacheService } from '../common/cache.service';

@Injectable()
export class ContributorService {
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
            try {
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
            } catch (err) {
              console.error(`Error processing repo ${repo.name}:`, err);
            }
          }),
        );
      }

      const allContributors = Array.from(contributorsMap.values()).map(
        (contributor) => ({
          ...contributor,
          repos: Array.from(contributor.repos),
        }),
      );

      this.cacheService.set(cacheKey, allContributors);
      return allContributors;
    } catch (error) {
      console.error('Error in getAllContributors:', error);
      throw new InternalServerErrorException({
        error: 'Failed to fetch repositories',
        message: error.message,
      });
    }
  }

  async getUserCreatedIssues(username: string) {
    if (!username || username.trim().length === 0) {
      throw new BadRequestException('Username is required');
    }

    try {
      const issues = await this.githubService.searchUserIssues(username);

      if (!issues) {
        throw new InternalServerErrorException(
          'Failed to fetch user-created issues',
        );
      }

      return { issues };
    } catch (error) {
      console.error(
        'Error fetching user created issues:',
        error.response ? error.response.data : error.message,
      );
      throw new InternalServerErrorException('Internal server error');
    }
  }

  async getUserCreatedPullRequests(username: string) {
    if (!username || username.trim().length === 0) {
      throw new BadRequestException('Username is required');
    }

    try {
      const pullRequests =
        await this.githubService.searchUserPullRequests(username);

      if (!pullRequests) {
        throw new InternalServerErrorException(
          'Failed to fetch user-created pull requests',
        );
      }

      return { pullRequests };
    } catch (error) {
      console.error(
        'Error fetching user created pull requests:',
        error.response ? error.response.data : error.message,
      );
      throw new InternalServerErrorException('Internal server error');
    }
  }

  /**
   * Combined endpoint: fetches both issues and PRs in parallel.
   * Saves the frontend from making 2 separate requests.
   */
  async getUserStats(username: string) {
    if (!username || username.trim().length === 0) {
      throw new BadRequestException('Username is required');
    }

    try {
      const [issues, pullRequests] = await Promise.all([
        this.githubService.searchUserIssues(username),
        this.githubService.searchUserPullRequests(username),
      ]);

      return {
        issues: issues || [],
        pullRequests: pullRequests || [],
      };
    } catch (error) {
      console.error(
        'Error fetching user stats:',
        error.response ? error.response.data : error.message,
      );
      throw new InternalServerErrorException('Internal server error');
    }
  }

  async getUserFollowersAndFollowing(username: string) {
    if (!username || username.trim().length === 0) {
      throw new BadRequestException('Username is required');
    }

    try {
      const result =
        await this.githubService.getUserFollowersAndFollowing(username);
      return result;
    } catch (error) {
      console.error(
        'Error fetching user followers and following:',
        error.response ? error.response.data : error.message,
      );
      throw new InternalServerErrorException(
        'Failed to fetch followers and following data',
      );
    }
  }
}

import {
  Injectable,
  Logger,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GithubService } from '../github/github.service';
import { CacheService } from '../common/cache.service';
import { Contributor } from '../database/entities/contributor.entity';

const CACHE_TTL = 300; // 5 minutes

@Injectable()
export class ContributorService {
  private readonly logger = new Logger(ContributorService.name);

  constructor(
    @InjectRepository(Contributor)
    private readonly contributorRepository: Repository<Contributor>,
    private githubService: GithubService,
    private cacheService: CacheService,
  ) {}

  async getAllContributors() {
    const cacheKey = 'all_contributors';
    const cached = this.cacheService.get(cacheKey);
    if (cached) return cached;

    try {
      const contributors = await this.contributorRepository
        .createQueryBuilder('contributor')
        .leftJoinAndSelect('contributor.repositoryContributors', 'rc')
        .leftJoinAndSelect('rc.repository', 'repository')
        .getMany();

      const allContributors = contributors
        .map((c) => {
          const repos = [];
          let totalContributions = 0;
          if (c.repositoryContributors) {
            for (const rc of c.repositoryContributors) {
              if (rc.repository && rc.repository.isActive) {
                totalContributions += rc.contributionCount;
                repos.push(rc.repository.name);
              }
            }
          }
          return {
            login: c.username,
            contributions: totalContributions,
            repos,
            avatar_url: c.avatarUrl,
          };
        })
        .filter((c) => c.repos.length > 0);

      this.cacheService.set(cacheKey, allContributors, CACHE_TTL);
      return allContributors;
    } catch (error) {
      this.logger.error('Error in getAllContributors:', error);
      throw new InternalServerErrorException(
        'Failed to fetch contributor data',
      );
    }
  }

  async getUserCreatedIssues(username: string) {
    try {
      const issues = await this.githubService.searchUserIssues(username);

      if (!issues) {
        throw new InternalServerErrorException(
          'Failed to fetch user-created issues',
        );
      }

      return { issues };
    } catch (error) {
      this.logger.error(
        'Error fetching user created issues:',
        error.response?.data || error.message,
      );
      throw new InternalServerErrorException('Internal server error');
    }
  }

  async getUserCreatedPullRequests(username: string) {
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
      this.logger.error(
        'Error fetching user created pull requests:',
        error.response?.data || error.message,
      );
      throw new InternalServerErrorException('Internal server error');
    }
  }

  /**
   * Combined endpoint: fetches both issues and PRs in parallel.
   * Saves the frontend from making 2 separate requests.
   */
  async getUserStats(username: string) {
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
      this.logger.error(
        'Error fetching user stats:',
        error.response?.data || error.message,
      );
      throw new InternalServerErrorException('Internal server error');
    }
  }
}

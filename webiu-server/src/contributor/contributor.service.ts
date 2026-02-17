import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { GithubService } from '../github/github.service';

@Injectable()
export class ContributorService {
  constructor(private githubService: GithubService) {}

  async getAllContributors() {
    try {
      const orgName = this.githubService.org;
      const contributorsMap = new Map();

      const repositories = await this.githubService.getOrgRepos();

      if (repositories.length === 0) {
        return [];
      }

      const BATCH_SIZE = 5;
      for (let i = 0; i < repositories.length; i += BATCH_SIZE) {
        const batch = repositories.slice(i, i + BATCH_SIZE);

        await Promise.all(
          batch.map(async (repo) => {
            try {
              const contributors =
                await this.githubService.getRepoContributors(
                  orgName,
                  repo.name,
                );
              if (!contributors?.length) return;

              contributors.forEach((contributor) => {
                const login = contributor.login;

                if (!contributorsMap.has(login)) {
                  contributorsMap.set(login, {
                    login,
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
}

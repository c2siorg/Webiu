import { Injectable, InternalServerErrorException, BadRequestException } from '@nestjs/common';
import { GithubService } from '../github/github.service';

@Injectable()
export class ProjectService {
  constructor(private githubService: GithubService) {}

  async getAllProjects() {
    try {
      const repositories = await this.githubService.getOrgRepos();

      const repositoriesWithPRs = await Promise.all(
        repositories.map(async (repo) => {
          const pulls = await this.githubService.getRepoPulls(repo.name);
          return {
            ...repo,
            pull_requests: pulls.length,
          };
        }),
      );

      return { repositories: repositoriesWithPRs };
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
      throw new BadRequestException(
        'Organization and repository are required',
      );
    }

    try {
      const data = await this.githubService.getRepoIssues(org, repo);

      const issues = data.filter((item) => !item.pull_request).length;
      const pullRequests = data.filter((item) => item.pull_request).length;

      return { issues, pullRequests };
    } catch (error) {
      console.error(
        'Error fetching issues and PRs:',
        error.response?.data || error.message,
      );
      throw new InternalServerErrorException(
        'Failed to fetch issues and PRs',
      );
    }
  }
}

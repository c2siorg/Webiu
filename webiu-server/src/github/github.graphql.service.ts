import {
  Injectable,
  Logger,
  InternalServerErrorException,
  BadRequestException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { CacheService } from '../common/cache.service';

const CACHE_TTL = 300;
const AXIOS_TIMEOUT = 35000;

@Injectable()
export class GithubGraphqlService {
  private readonly logger = new Logger(GithubGraphqlService.name);
  private readonly endpoint = 'https://api.github.com/graphql';
  private readonly accessToken: string;
  private readonly orgName: string;

  constructor(
    private readonly cacheService: CacheService,
    private readonly configService: ConfigService,
  ) {
    this.accessToken = this.configService.get<string>('GITHUB_ACCESS_TOKEN')!;
    this.orgName = this.configService.get<string>('GITHUB_ORG') || 'c2siorg';
  }

  private get headers() {
    return {
      Authorization: `Bearer ${this.accessToken}`,
    };
  }

  /**
   * Fetches pull requests authored by a user within the organization via GitHub GraphQL API.
   * Limited to 100 results (GitHub GraphQL search pagination not implemented).
   */
  async searchUserPullRequests(username: string) {
    if (!username || !/^[a-zA-Z0-9-]+$/.test(username)) {
      throw new BadRequestException('Invalid GitHub username');
    }

    const normalizedUsername = username.toLowerCase();
    const cacheKey = `graphql_prs_${normalizedUsername}`;

    const cached = this.cacheService.get(cacheKey);
    if (cached) {
      return cached;
    }

    const query = `
      query($searchQuery: String!) {
        search(query: $searchQuery, type: ISSUE, first: 100) {
          nodes {
            ... on PullRequest {
              title
              createdAt
              mergedAt
              state
              url
              repository {
                name
              }
            }
          }
        }
      }
    `;

    const searchQuery = `author:${normalizedUsername} org:${this.orgName} type:pr`;

    try {
      const response = await axios.post(
        this.endpoint,
        { query, variables: { searchQuery } },
        { headers: this.headers, timeout: AXIOS_TIMEOUT },
      );

      if (!response.data?.data) {
        throw new Error('Invalid response from GitHub API');
      }

      const prs = response.data.data.search.nodes;

      this.cacheService.set(cacheKey, prs, CACHE_TTL);

      return prs;
    } catch (error: any) {
      this.logger.error(
        'GitHub GraphQL Error:',
        error.response?.data || error.message,
      );

      throw new InternalServerErrorException(
        'Failed to fetch pull requests from GitHub',
      );
    }
  }
}

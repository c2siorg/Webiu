import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { CacheService } from '../common/cache.service';

const CACHE_TTL = 300;

@Injectable()
export class GithubGraphqlService {
  private readonly endpoint = 'https://api.github.com/graphql';
  private readonly accessToken: string;

  constructor(
    private readonly cacheService: CacheService,
    private readonly configService: ConfigService,
  ) {
    this.accessToken = this.configService.get<string>('GITHUB_ACCESS_TOKEN')!;
  }

  private get headers() {
    return {
      Authorization: `Bearer ${this.accessToken}`,
    };
  }

  async searchUserPullRequests(username: string) {
    const cacheKey = `graphql_prs_${username}`;

    const cached = await this.cacheService.get(cacheKey);
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

    const searchQuery = `author:${username} org:c2siorg type:pr`;

    try {
      const response = await axios.post(
        this.endpoint,
        { query, variables: { searchQuery } },
        { headers: this.headers },
      );

      if (!response.data?.data) {
        throw new Error('Invalid response from GitHub API');
      }

      const prs = response.data.data.search.nodes;

      await this.cacheService.set(cacheKey, prs, CACHE_TTL);

      return prs;
    } catch (error: any) {
      console.error(
        'GitHub GraphQL Error:',
        error.response?.data || error.message,
      );

      throw new InternalServerErrorException(
        'Failed to fetch pull requests from GitHub',
      );
    }
  }
}

import { Injectable } from '@nestjs/common';
import axios from 'axios';
import { CacheService } from '../common/cache.service';

const CACHE_TTL = 300;

@Injectable()
export class GithubGraphqlService {
  private readonly endpoint = 'https://api.github.com/graphql';

  constructor(private cacheService: CacheService) {}

  private get headers() {
    return {
      Authorization: `Bearer ${process.env.GITHUB_ACCESS_TOKEN}`,
    };
  }

  async searchUserPullRequests(username: string) {
    const start = Date.now();
    const cacheKey = `graphql_prs_${username}`;
    const cached = await this.cacheService.get(cacheKey);
    if (cached) {
      const duration = Date.now() - start;
      const payloadSize = JSON.stringify(cached).length;

      console.log(
        `[GRAPHQL] searchUserPullRequests - ${duration}ms - ${payloadSize} bytes (CACHE HIT)`,
      );

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
    const response = await axios.post(
      this.endpoint,
      { query, variables: { searchQuery } },
      { headers: this.headers },
    );
    console.log('FULL RESPONSE:', JSON.stringify(response.data, null, 2));

    if (!response.data.data) {
      throw new Error('GitHub returned error. Check logs above.');
    }

    const prs = response.data.data.search.nodes;

    await this.cacheService.set(cacheKey, prs, CACHE_TTL);

    const duration = Date.now() - start;
    const payloadSize = JSON.stringify(prs).length;

    console.log(
      `[GRAPHQL] searchUserPullRequests - ${duration}ms - ${payloadSize} bytes`,
    );
    return prs;
  }
}

/*GraphQL allows 
us to fetch all the necessary data in a single request, including the
repository {
       name
    }
without making another API call

*/

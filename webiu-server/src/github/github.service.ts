import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CacheService } from '../common/cache.service';
import axios from 'axios';

const CACHE_TTL = 300; // 5 minutes

@Injectable()
export class GithubService {
  private readonly baseUrl = 'https://api.github.com';
  private readonly accessToken: string;
  private readonly orgName = 'c2siorg';

  constructor(
    private configService: ConfigService,
    private cacheService: CacheService,
  ) {
    this.accessToken = this.configService.get<string>('GITHUB_ACCESS_TOKEN');
  }

  private get headers() {
    return {
      Authorization: `token ${this.accessToken}`,
    };
  }

  get org(): string {
    return this.orgName;
  }

  private async fetchAllPages(url: string): Promise<any[]> {
    const results: any[] = [];
    let page = 1;

    while (true) {
      const separator = url.includes('?') ? '&' : '?';
      const response = await axios.get(
        `${url}${separator}per_page=100&page=${page}`,
        { headers: this.headers },
      );

      const data = response.data;
      if (!Array.isArray(data) || data.length === 0) break;

      results.push(...data);

      if (data.length < 100) break;
      page++;
    }

    return results;
  }

  private async fetchAllSearchPages(url: string): Promise<any[]> {
    const results: any[] = [];
    let page = 1;

    while (true) {
      const separator = url.includes('?') ? '&' : '?';
      const response = await axios.get(
        `${url}${separator}per_page=100&page=${page}`,
        { headers: this.headers },
      );

      const items = response.data.items || [];
      if (items.length === 0) break;

      results.push(...items);

      if (items.length < 100) break;
      page++;
    }

    return results;
  }

  async getOrgRepos(): Promise<any[]> {
    const cacheKey = `org_repos_${this.orgName}`;
    const cached = this.cacheService.get<any[]>(cacheKey);
    if (cached) return cached;

    const repos = await this.fetchAllPages(
      `${this.baseUrl}/orgs/${this.orgName}/repos`,
    );
    this.cacheService.set(cacheKey, repos, CACHE_TTL);
    return repos;
  }

  async getRepoPulls(repoName: string): Promise<any[]> {
    const cacheKey = `pulls_${this.orgName}_${repoName}`;
    const cached = this.cacheService.get<any[]>(cacheKey);
    if (cached) return cached;

    const pulls = await this.fetchAllPages(
      `${this.baseUrl}/repos/${this.orgName}/${repoName}/pulls`,
    );
    this.cacheService.set(cacheKey, pulls, CACHE_TTL);
    return pulls;
  }

  async getRepoIssues(org: string, repo: string): Promise<any[]> {
    const cacheKey = `issues_${org}_${repo}`;
    const cached = this.cacheService.get<any[]>(cacheKey);
    if (cached) return cached;

    const issues = await this.fetchAllPages(
      `${this.baseUrl}/repos/${org}/${repo}/issues`,
    );
    this.cacheService.set(cacheKey, issues, CACHE_TTL);
    return issues;
  }

  async getRepoContributors(
    orgName: string,
    repoName: string,
  ): Promise<any[] | null> {
    const cacheKey = `contributors_${orgName}_${repoName}`;
    const cached = this.cacheService.get<any[] | null>(cacheKey);
    if (cached !== null) return cached;

    try {
      const contributors = await this.fetchAllPages(
        `${this.baseUrl}/repos/${orgName}/${repoName}/contributors`,
      );
      this.cacheService.set(cacheKey, contributors, CACHE_TTL);
      return contributors;
    } catch {
      return null;
    }
  }

  async searchUserIssues(username: string): Promise<any[]> {
    const cacheKey = `search_issues_${username}_${this.orgName}`;
    const cached = this.cacheService.get<any[]>(cacheKey);
    if (cached) return cached;

    const issues = await this.fetchAllSearchPages(
      `${this.baseUrl}/search/issues?q=author:${username}+org:${this.orgName}+type:issue`,
    );
    this.cacheService.set(cacheKey, issues, CACHE_TTL);
    return issues;
  }

  async searchUserPullRequests(username: string): Promise<any[]> {
    const cacheKey = `search_prs_${username}_${this.orgName}`;
    const cached = this.cacheService.get<any[]>(cacheKey);
    if (cached) return cached;

    const prs = await this.fetchAllSearchPages(
      `${this.baseUrl}/search/issues?q=author:${username}+org:${this.orgName}+type:pr`,
    );

    // Fetch details for closed PRs to determine if they were merged
    const enrichedPrs = await Promise.all(
      prs.map(async (pr) => {
        // Only fetch details if closed and we don't know if merged (merged_at missing)
        // Note: Search API results for PRs don't include merged_at at the top level usually
        if (pr.state === 'closed' && !pr.merged_at && pr.pull_request?.url) {
          try {
            const response = await axios.get(pr.pull_request.url, {
              headers: this.headers,
            });
            if (response.data.merged_at) {
              pr.merged_at = response.data.merged_at;
            }
          } catch {
            // Ignore errors for individual PR fetches to avoid failing the whole request
          }
        }
        return pr;
      }),
    );

    // Sort by created_at descending
    enrichedPrs.sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    );

    this.cacheService.set(cacheKey, enrichedPrs, CACHE_TTL);
    return enrichedPrs;
  }

  async getUserInfo(accessToken: string): Promise<any> {
    const response = await axios.get(`${this.baseUrl}/user`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    return response.data;
  }

  async exchangeGithubCode(
    clientId: string,
    clientSecret: string,
    code: string,
    redirectUri: string,
  ): Promise<any> {
    const response = await axios.post(
      'https://github.com/login/oauth/access_token',
      new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        code,
        redirect_uri: redirectUri,
      }).toString(),
      {
        headers: {
          Accept: 'application/json',
        },
      },
    );
    return response.data;
  }
}

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CacheService } from '../common/cache.service';
import axios from 'axios';
import {
  GithubRepository,
  GithubPullRequest,
  GithubIssue,
  GithubContributor,
  GithubUserProfile,
  GithubOAuthTokenResponse,
} from './interfaces';

const CACHE_TTL = 300; // 5 minutes

@Injectable()
export class GithubService {
  private readonly logger = new Logger(GithubService.name);
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

  private async fetchAllPages<T>(url: string): Promise<T[]> {
    const results: T[] = [];
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

  private async fetchAllSearchPages<T>(url: string): Promise<T[]> {
    const results: T[] = [];
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

  async getOrgRepos(): Promise<GithubRepository[]>;
  async getOrgRepos(page: number, perPage: number): Promise<GithubRepository[]>;
  async getOrgRepos(
    page?: number,
    perPage?: number,
  ): Promise<GithubRepository[]> {
    if (page !== undefined && perPage !== undefined) {
      const cacheKey = `org_repos_${this.orgName}_p${page}_pp${perPage}`;
      const cached = this.cacheService.get<GithubRepository[]>(cacheKey);
      if (cached) return cached;

      const response = await axios.get(
        `${this.baseUrl}/orgs/${this.orgName}/repos?per_page=${perPage}&page=${page}`,
        { headers: this.headers },
      );
      const repos = response.data;
      this.cacheService.set(cacheKey, repos, CACHE_TTL);
      return repos;
    }

    const cacheKey = `org_repos_${this.orgName}`;
    const cached = this.cacheService.get<GithubRepository[]>(cacheKey);
    if (cached) return cached;

    const repos = await this.fetchAllPages<GithubRepository>(
      `${this.baseUrl}/orgs/${this.orgName}/repos`,
    );
    this.cacheService.set(cacheKey, repos);
    return repos;
  }

  async getRepoPulls(repoName: string): Promise<GithubPullRequest[]> {
    const cacheKey = `pulls_${this.orgName}_${repoName}`;
    const cached = this.cacheService.get<GithubPullRequest[]>(cacheKey);
    if (cached) return cached;

    const pulls = await this.fetchAllPages<GithubPullRequest>(
      `${this.baseUrl}/repos/${this.orgName}/${repoName}/pulls`,
    );
    this.cacheService.set(cacheKey, pulls);
    return pulls;
  }

  async getRepoIssues(org: string, repo: string): Promise<GithubIssue[]> {
    const cacheKey = `issues_${org}_${repo}`;
    const cached = this.cacheService.get<GithubIssue[]>(cacheKey);
    if (cached) return cached;

    const issues = await this.fetchAllPages<GithubIssue>(
      `${this.baseUrl}/repos/${org}/${repo}/issues`,
    );
    this.cacheService.set(cacheKey, issues);
    return issues;
  }

  async getRepoContributors(
    orgName: string,
    repoName: string,
  ): Promise<GithubContributor[] | null> {
    const cacheKey = `contributors_${orgName}_${repoName}`;
    const cached = this.cacheService.get<GithubContributor[] | null>(cacheKey);
    if (cached !== null) return cached;

    try {
      const contributors = await this.fetchAllPages<GithubContributor>(
        `${this.baseUrl}/repos/${orgName}/${repoName}/contributors`,
      );
      this.cacheService.set(cacheKey, contributors);
      return contributors;
    } catch {
      return null;
    }
  }

  async searchUserIssues(username: string): Promise<GithubIssue[]> {
    const normalizedUsername = username.toLowerCase();
    const cacheKey = `search_issues:${normalizedUsername}:${this.orgName}`;
    const cached = this.cacheService.get<GithubIssue[]>(cacheKey);
    if (cached) return cached;

    const issues = await this.fetchAllSearchPages<GithubIssue>(
      `${this.baseUrl}/search/issues?q=author:${username}+org:${this.orgName}+type:issue`,
    );
    this.cacheService.set(cacheKey, issues);
    return issues;
  }

  async searchUserPullRequests(username: string): Promise<GithubIssue[]> {
    const normalizedUsername = username.toLowerCase();
    const cacheKey = `search_prs:${normalizedUsername}:${this.orgName}`;
    const cached = this.cacheService.get<GithubIssue[]>(cacheKey);
    if (cached) return cached;

    const prs = await this.fetchAllSearchPages<GithubIssue>(
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

    this.cacheService.set(cacheKey, enrichedPrs);
    return enrichedPrs;
  }

  async getUserInfo(accessToken: string): Promise<GithubUserProfile> {
    const response = await axios.get(`${this.baseUrl}/user`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    return response.data;
  }

  async getPublicUserProfile(username: string): Promise<GithubUserProfile> {
    const cacheKey = `user_profile_${username}`;
    const cached = this.cacheService.get<GithubUserProfile>(cacheKey);
    if (cached) return cached;

    const response = await axios.get(`${this.baseUrl}/users/${username}`, {
      headers: this.headers,
    });
    this.cacheService.set(cacheKey, response.data);
    return response.data;
  }

  async exchangeGithubCode(
    clientId: string,
    clientSecret: string,
    code: string,
    redirectUri: string,
  ): Promise<GithubOAuthTokenResponse> {
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

  async getUserFollowersAndFollowing(username: string): Promise<{
    followers: number;
    following: number;
  }> {
    const normalizedUsername = username.toLowerCase();
    const cacheKey = `user_social:${normalizedUsername}`;
    const cached = this.cacheService.get<{
      followers: number;
      following: number;
    }>(cacheKey);
    if (cached) return cached;

    try {
      const [followersResponse, followingResponse] = await Promise.all([
        axios.get(`${this.baseUrl}/users/${username}/followers`, {
          headers: this.headers,
        }),
        axios.get(`${this.baseUrl}/users/${username}/following`, {
          headers: this.headers,
        }),
      ]);

      const result = {
        followers: followersResponse.data.length || 0,
        following: followingResponse.data.length || 0,
      };

      this.cacheService.set(cacheKey, result);
      return result;
    } catch (error) {
      this.logger.error(
        `Error fetching GitHub social data for ${username}:`,
        error.message,
      );
      throw error;
    }
  }
}

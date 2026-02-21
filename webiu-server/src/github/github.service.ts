import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CacheService } from '../common/cache.service';
import axios, { AxiosError } from 'axios';

export interface GithubRepo {
  name: string;
  full_name: string;
  html_url: string;
  description: string | null;
  homepage: string | null;
  language: string | null;
  stargazers_count: number;
  forks_count: number;
  open_issues_count: number;
  topics: string[];
  archived: boolean;
  fork: boolean;
  created_at: string;
  pushed_at: string;
  [key: string]: unknown;
}

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

  /**
   * Fetches ALL org repos, sorts alphabetically, and caches the full list.
   * One-time fetch per cache window avoids per-page GitHub API calls.
   */
  async getAllOrgReposSorted(): Promise<GithubRepo[]> {
    const cacheKey = `all_org_repos_sorted_${this.orgName}`;
    const cached = this.cacheService.get<GithubRepo[]>(cacheKey);
    if (cached) return cached;

    const repos = await this.fetchAllPages(
      `${this.baseUrl}/orgs/${this.orgName}/repos`,
    );

    repos.sort((a: GithubRepo, b: GithubRepo) =>
      a.name.toLowerCase().localeCompare(b.name.toLowerCase()),
    );

    this.cacheService.set(cacheKey, repos, 600);
    return repos;
  }

  /**
   * Efficient PR count: fetches 1 item and reads the Link header to get total.
   * Single API call per repo vs. fetching all PR pages.
   */
  async getRepoPullCount(repoName: string): Promise<number> {
    const cacheKey = `pull_count_${this.orgName}_${repoName}`;
    const cached = this.cacheService.get<number>(cacheKey);
    if (cached !== null) return cached;

    try {
      const response = await axios.get(
        `${this.baseUrl}/repos/${this.orgName}/${repoName}/pulls?state=all&per_page=1`,
        { headers: this.headers },
      );

      let count = 0;
      const linkHeader = response.headers['link'];
      if (linkHeader) {
        const lastMatch = linkHeader.match(/page=(\d+)>;\s*rel="last"/);
        if (lastMatch) {
          count = parseInt(lastMatch[1], 10);
        }
      } else if (Array.isArray(response.data) && response.data.length > 0) {
        count = response.data.length;
      }

      this.cacheService.set(cacheKey, count, 600);
      return count;
    } catch {
      return 0;
    }
  }

  async getOrgRepos(): Promise<any[]>;
  async getOrgRepos(page: number, perPage: number): Promise<any[]>;
  async getOrgRepos(page?: number, perPage?: number): Promise<any[]> {
    if (page !== undefined && perPage !== undefined) {
      const cacheKey = `org_repos_${this.orgName}_p${page}_pp${perPage}`;
      const cached = this.cacheService.get<any[]>(cacheKey);
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
    const cached = this.cacheService.get<any[]>(cacheKey);
    if (cached) return cached;

    const repos = await this.fetchAllPages(
      `${this.baseUrl}/orgs/${this.orgName}/repos`,
    );
    this.cacheService.set(cacheKey, repos);
    return repos;
  }

  /**
   * Fetches metadata for a single repository.
   * Returns null if the repository is not found (404).
   */
  async getRepo(repoName: string): Promise<GithubRepo | null> {
    const cacheKey = `repo_${this.orgName}_${repoName}`;
    const cached = this.cacheService.get<GithubRepo>(cacheKey);
    if (cached) return cached;

    try {
      const response = await axios.get(
        `${this.baseUrl}/repos/${this.orgName}/${repoName}`,
        { headers: this.headers },
      );
      const repo = response.data;
      this.cacheService.set(cacheKey, repo, CACHE_TTL);
      return repo;
    } catch (error: unknown) {
      if (error instanceof AxiosError && error.response?.status === 404) {
        return null;
      }
      throw error;
    }
  }

  /**
   * Fetches the commit activity stats for a repository (last 52 weeks).
   * Note: GitHub stats endpoints can return 202 Accepted if the data is being computed.
   */
  async getCommitActivity(repoName: string): Promise<any[]> {
    const cacheKey = `commit_activity_${this.orgName}_${repoName}`;
    const cached = this.cacheService.get<any[]>(cacheKey);
    if (cached) return cached;

    try {
      const response = await axios.get(
        `${this.baseUrl}/repos/${this.orgName}/${repoName}/stats/commit_activity`,
        { headers: this.headers },
      );

      // Handle 202 Accepted or empty: Try fallback to participation stats
      if (
        response.status === 202 ||
        !response.data ||
        response.data.length === 0
      ) {
        this.logger.log(
          `Commit activity for ${repoName} is missing or being computed. Trying participation fallback.`,
        );
        return this.getParticipationStats(repoName);
      }

      const activity = response.data;
      const STATS_CACHE_TTL = 3600 * 24; // 24 hours
      this.cacheService.set(cacheKey, activity, STATS_CACHE_TTL);
      return activity;
    } catch {
      this.logger.warn(
        `Commit activity failed for ${repoName}, falling back to participation.`,
      );
      return this.getParticipationStats(repoName);
    }
  }

  /**
   * Fetches the participation stats (last 52 weeks) as a fallback for activity.
   */
  async getParticipationStats(repoName: string): Promise<any[]> {
    const cacheKey = `participation_${this.orgName}_${repoName}`;
    const cached = this.cacheService.get<any[]>(cacheKey);
    if (cached) return cached;

    try {
      const response = await axios.get(
        `${this.baseUrl}/repos/${this.orgName}/${repoName}/stats/participation`,
        { headers: this.headers },
      );

      if (response.data && response.data.all) {
        // Map [1, 2, 3] to [{ total: 1 }, { total: 2 }, { total: 3 }]
        const activity = response.data.all.map((count: number) => ({
          total: count,
        }));
        this.cacheService.set(cacheKey, activity, 3600 * 24);
        return activity;
      }
      return [];
    } catch (error: unknown) {
      this.logger.error(
        `Failed to fetch participation stats for ${repoName}:`,
        (error as Error).message,
      );
      return [];
    }
  }

  /**
   * Fetches the latest release for a repository.
   */
  async getLatestRelease(repoName: string): Promise<any | null> {
    const cacheKey = `latest_release_${this.orgName}_${repoName}`;
    const cached = this.cacheService.get<any>(cacheKey);
    if (cached) return cached;

    try {
      const response = await axios.get(
        `${this.baseUrl}/repos/${this.orgName}/${repoName}/releases/latest`,
        { headers: this.headers },
      );
      const release = response.data;
      this.cacheService.set(cacheKey, release, CACHE_TTL);
      return release;
    } catch (error: unknown) {
      if (error instanceof AxiosError && error.response?.status === 404) {
        return null;
      }
      this.logger.error(
        `Failed to fetch latest release for ${repoName}:`,
        (error as Error).message,
      );
      return null;
    }
  }

  async getRepoPulls(repoName: string): Promise<any[]> {
    const cacheKey = `pulls_${this.orgName}_${repoName}`;
    const cached = this.cacheService.get<any[]>(cacheKey);
    if (cached) return cached;

    const pulls = await this.fetchAllPages(
      `${this.baseUrl}/repos/${this.orgName}/${repoName}/pulls?state=all`,
    );
    this.cacheService.set(cacheKey, pulls);
    return pulls;
  }

  async getRepoIssues(org: string, repo: string): Promise<any[]> {
    const cacheKey = `issues_${org}_${repo}`;
    const cached = this.cacheService.get<any[]>(cacheKey);
    if (cached) return cached;

    const issues = await this.fetchAllPages(
      `${this.baseUrl}/repos/${org}/${repo}/issues`,
    );
    this.cacheService.set(cacheKey, issues);
    return issues;
  }

  async getRepoLanguages(repoName: string): Promise<Record<string, number>> {
    const cacheKey = `languages_${this.orgName}_${repoName}`;
    const cached = this.cacheService.get<Record<string, number>>(cacheKey);
    if (cached) return cached;

    try {
      const response = await axios.get(
        `${this.baseUrl}/repos/${this.orgName}/${repoName}/languages`,
        { headers: this.headers },
      );
      const languages = response.data;
      this.cacheService.set(cacheKey, languages, CACHE_TTL);
      return languages;
    } catch (error: unknown) {
      const axiosErr = error instanceof AxiosError ? error : null;
      this.logger.error(
        `Failed to fetch languages for ${repoName}:`,
        axiosErr?.response?.data || (error as Error).message,
      );
      return {};
    }
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
      this.cacheService.set(cacheKey, contributors);
      return contributors;
    } catch {
      return null;
    }
  }

  async searchUserIssues(username: string): Promise<any[]> {
    const normalizedUsername = username.toLowerCase();
    const cacheKey = `search_issues:${normalizedUsername}:${this.orgName}`;
    const cached = this.cacheService.get<any[]>(cacheKey);
    if (cached) return cached;

    const issues = await this.fetchAllSearchPages(
      `${this.baseUrl}/search/issues?q=author:${username}+org:${this.orgName}+type:issue`,
    );
    this.cacheService.set(cacheKey, issues);
    return issues;
  }

  async searchUserPullRequests(username: string): Promise<any[]> {
    const normalizedUsername = username.toLowerCase();
    const cacheKey = `search_prs:${normalizedUsername}:${this.orgName}`;
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

    this.cacheService.set(cacheKey, enrichedPrs);
    return enrichedPrs;
  }

  async getUserInfo(accessToken: string): Promise<any> {
    const response = await axios.get(`${this.baseUrl}/user`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    return response.data;
  }

  async getPublicUserProfile(username: string): Promise<any> {
    const cacheKey = `user_profile_${username}`;
    const cached = this.cacheService.get<any>(cacheKey);
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

  async searchOrgRepos(query: string): Promise<any[]> {
    const normalizedQuery = query.toLowerCase();
    const cacheKey = `search_repos:${normalizedQuery}:${this.orgName}`;
    const cached = this.cacheService.get<any[]>(cacheKey);
    if (cached) return cached;

    const encoded = encodeURIComponent(query);
    const repos = await this.fetchAllSearchPages(
      `${this.baseUrl}/search/repositories?q=${encoded}+org:${this.orgName}`,
    );

    this.cacheService.set(cacheKey, repos);
    return repos;
  }
}

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CacheService } from '../common/cache.service';
import axios, { AxiosInstance } from 'axios';

const CACHE_TTL = 300; // 5 minutes

@Injectable()
export class GithubService {
  private readonly logger = new Logger(GithubService.name);
  private readonly baseUrl = 'https://api.github.com';
  private readonly accessToken: string;
  private readonly orgName: string;

  // PROBLEM: Every axios call used the global axios with no timeout (default: 0 = infinite).
  // If GitHub API is slow or rate-limited (429), requests hang forever.
  // The reverse proxy waits, exhausts its own timeout, and returns 504 to the client.
  //
  // SOLUTION: A shared axios instance with:
  //   - timeout: 10 s  — fail fast instead of hanging forever
  //   - baseURL        — removes repetition across all methods
  //   - Authorization  — set once, not per-call
  private readonly http: AxiosInstance;

  constructor(
    private configService: ConfigService,
    private cacheService: CacheService,
  ) {
    this.accessToken = this.configService.get<string>('GITHUB_ACCESS_TOKEN');
    // OPTIMIZATION: Read org name from env so it's configurable without code changes.
    // Previously hardcoded to 'c2siorg'; now falls back to that if unset.
    this.orgName = this.configService.get<string>('GITHUB_ORG_NAME', 'c2siorg');

    this.http = axios.create({
      baseURL: this.baseUrl,
      timeout: 10_000, // 10 seconds — fail fast, don't hang the request pipeline
      headers: {
        Authorization: `token ${this.accessToken}`,
      },
    });
  }

  get org(): string {
    return this.orgName;
  }

  /**
   * OPTIMIZATION: Unified pagination fetcher.
   *
   * PROBLEM: `fetchAllPages` and `fetchAllSearchPages` were two separate methods
   * with identical logic differing only in how they extract the array from the
   * response (`data` vs `data.items`). Any bug fix or improvement had to be
   * applied in two places.
   *
   * SOLUTION: Single method with an optional `itemKey` parameter.
   *   - `fetchAllPages(url)`          → treats response.data as the array (list endpoints)
   *   - `fetchAllPages(url, 'items')` → treats response.data.items as the array (search endpoints)
   */
  private async fetchAllPages(url: string, itemKey?: string): Promise<any[]> {
    const results: any[] = [];
    let page = 1;

    while (true) {
      const separator = url.includes('?') ? '&' : '?';
      const response = await this.http.get(
        `${url}${separator}per_page=100&page=${page}`,
      );

      const data: any[] = itemKey
        ? (response.data[itemKey] ?? [])
        : response.data;

      if (!Array.isArray(data) || data.length === 0) break;

      results.push(...data);

      if (data.length < 100) break;
      page++;
    }

    return results;
  }

  async getOrgRepos(): Promise<any[]>;
  async getOrgRepos(page: number, perPage: number): Promise<any[]>;
  async getOrgRepos(page?: number, perPage?: number): Promise<any[]> {
    if (page !== undefined && perPage !== undefined) {
      const cacheKey = `org_repos_${this.orgName}_p${page}_pp${perPage}`;
      const cached = this.cacheService.get<any[]>(cacheKey);
      if (cached) return cached;

      const response = await this.http.get(
        `/orgs/${this.orgName}/repos?per_page=${perPage}&page=${page}`,
      );
      const repos = response.data;
      this.cacheService.set(cacheKey, repos, CACHE_TTL);
      return repos;
    }

    const cacheKey = `org_repos_${this.orgName}`;
    const cached = this.cacheService.get<any[]>(cacheKey);
    if (cached) return cached;

    const repos = await this.fetchAllPages(`/orgs/${this.orgName}/repos`);
    this.cacheService.set(cacheKey, repos);
    return repos;
  }

  /**
   * OPTIMIZATION: Count open PRs via a single request + Link header parsing.
   *
   * PROBLEM: `getRepoPulls` fetches the complete list of all open PRs (paginated, full
   * objects) and the caller just does `.length`. For a repo with 200 open PRs that's
   * 2 API requests and ~200 large JSON objects transferred — purely to get a number.
   *
   * SOLUTION: Request `per_page=1` so GitHub returns at most 1 PR object. When there
   * are more results, GitHub adds a `Link` header like:
   *   <...?page=2>; rel="next", <...?page=47>; rel="last"
   * Parsing the `page=N` from rel="last" gives the total page count, which equals the
   * total PR count (since per_page=1). If there's no Link header, the count is 0 or 1.
   * This reduces N paginated API calls to exactly 1.
   */
  async getRepoPullCount(repoName: string): Promise<number> {
    const cacheKey = `pull_count_${this.orgName}_${repoName}`;
    const cached = this.cacheService.get<number>(cacheKey);
    if (cached !== null) return cached;

    try {
      const response = await this.http.get(
        `/repos/${this.orgName}/${repoName}/pulls?state=open&per_page=1`,
      );

      const link: string = response.headers['link'] ?? '';
      let count: number;

      if (!link) {
        // No pagination header means 0 or 1 result
        count = Array.isArray(response.data) ? response.data.length : 0;
      } else {
        // Parse the last page number from: <...?page=N>; rel="last"
        const match = link.match(/[?&]page=(\d+)>;\s*rel="last"/);
        count = match ? parseInt(match[1], 10) : response.data.length;
      }

      this.cacheService.set(cacheKey, count);
      return count;
    } catch {
      return 0;
    }
  }

  async getRepoPulls(repoName: string): Promise<any[]> {
    const cacheKey = `pulls_${this.orgName}_${repoName}`;
    const cached = this.cacheService.get<any[]>(cacheKey);
    if (cached) return cached;

    const pulls = await this.fetchAllPages(
      `/repos/${this.orgName}/${repoName}/pulls`,
    );
    this.cacheService.set(cacheKey, pulls);
    return pulls;
  }

  async getRepoIssues(org: string, repo: string): Promise<any[]> {
    const cacheKey = `issues_${org}_${repo}`;
    const cached = this.cacheService.get<any[]>(cacheKey);
    if (cached) return cached;

    const issues = await this.fetchAllPages(`/repos/${org}/${repo}/issues`);
    this.cacheService.set(cacheKey, issues);
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
        `/repos/${orgName}/${repoName}/contributors`,
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

    const issues = await this.fetchAllPages(
      `/search/issues?q=author:${username}+org:${this.orgName}+type:issue`,
      'items',
    );
    this.cacheService.set(cacheKey, issues);
    return issues;
  }

  async searchUserPullRequests(username: string): Promise<any[]> {
    const normalizedUsername = username.toLowerCase();
    const cacheKey = `search_prs:${normalizedUsername}:${this.orgName}`;
    const cached = this.cacheService.get<any[]>(cacheKey);
    if (cached) return cached;

    const prs = await this.fetchAllPages(
      `/search/issues?q=author:${username}+org:${this.orgName}+type:pr`,
      'items',
    );

    // Fetch details for closed PRs to determine if they were merged
    const enrichedPrs = await Promise.all(
      prs.map(async (pr) => {
        // Only fetch details if closed and we don't know if merged (merged_at missing)
        // Note: Search API results for PRs don't include merged_at at the top level usually
        if (pr.state === 'closed' && !pr.merged_at && pr.pull_request?.url) {
          try {
            // pr.pull_request.url is an absolute URL (api.github.com/...), use global axios
            const response = await axios.get(pr.pull_request.url, {
              timeout: 10_000,
              headers: { Authorization: `token ${this.accessToken}` },
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
    const response = await this.http.get('/user', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    return response.data;
  }

  async getPublicUserProfile(username: string): Promise<any> {
    const cacheKey = `user_profile_${username}`;
    const cached = this.cacheService.get<any>(cacheKey);
    if (cached) return cached;

    const response = await this.http.get(`/users/${username}`);
    this.cacheService.set(cacheKey, response.data);
    return response.data;
  }

  async exchangeGithubCode(
    clientId: string,
    clientSecret: string,
    code: string,
    redirectUri: string,
  ): Promise<any> {
    // This calls github.com (not api.github.com), so use global axios directly.
    const response = await axios.post(
      'https://github.com/login/oauth/access_token',
      new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        code,
        redirect_uri: redirectUri,
      }).toString(),
      {
        timeout: 10_000,
        headers: {
          Accept: 'application/json',
        },
      },
    );
    return response.data;
  }

  /**
   * OPTIMIZATION: Use the user profile endpoint instead of fetching follower/following lists.
   *
   * PROBLEM: The old implementation called `/users/{u}/followers` and `/users/{u}/following`
   * (both paginated list endpoints) and used `.length` to count results. This means:
   *   - 2 API calls per user (instead of 1)
   *   - Fetches full user objects for every follower/following just to count them
   *   - For a user with 500 followers, that's 5 paginated pages = 10 API calls total
   *
   * SOLUTION: `/users/{username}` already returns `followers` and `following` as numeric
   * fields — exactly what we need, in a single request. We also share this cache key with
   * `getPublicUserProfile` to avoid a second call if the profile was already fetched.
   */
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
      const response = await this.http.get(`/users/${username}`);

      const result = {
        followers: response.data.followers ?? 0,
        following: response.data.following ?? 0,
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

    const repos = await this.fetchAllPages(
      `/search/repositories?q=${query}+org:${this.orgName}`,
      'items',
    );

    this.cacheService.set(cacheKey, repos);
    return repos;
  }
}

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CacheService } from '../common/cache.service';
import { PersistenceService } from '../common/persistence.service';
import axios, { AxiosInstance } from 'axios';

const CACHE_TTL = 300; // 5 minutes

@Injectable()
export class GithubService {
  private readonly logger = new Logger(GithubService.name);
  private readonly baseUrl = 'https://api.github.com';
  private readonly githubAxios: AxiosInstance;
  private readonly accessToken: string;
  private readonly orgName = 'c2siorg';

  constructor(
    private configService: ConfigService,
    private cacheService: CacheService,
    private persistenceService: PersistenceService,
  ) {
    this.accessToken = this.configService.get<string>('GITHUB_ACCESS_TOKEN');

    this.githubAxios = axios.create({
      baseURL: this.baseUrl,
      headers: {
        Authorization: `token ${this.accessToken}`,
      },
    });

    this.githubAxios.interceptors.response.use(
      (response) => response,
      async (error) => {
        const { config, response } = error;
        if (response && (response.status === 403 || response.status === 429)) {
          const rateLimitRemaining = response.headers['x-ratelimit-remaining'];
          const rateLimitReset = response.headers['x-ratelimit-reset'];

          if (rateLimitRemaining === '0' || response.status === 429) {
            const resetTime = parseInt(rateLimitReset) * 1000;
            const waitTime = Math.max(resetTime - Date.now(), 0) + 1000; // +1s buffer

            this.logger.warn(
              `GitHub Rate limit exceeded. Waiting ${waitTime / 1000}s until reset.`,
            );

            await new Promise((resolve) => setTimeout(resolve, waitTime));
            return this.githubAxios(config); // Retry the request
          }
        }
        return Promise.reject(error);
      },
    );
  }

  get org(): string {
    return this.orgName;
  }

  private async fetchAllPages(url: string): Promise<any[]> {
    const results: any[] = [];
    let page = 1;

    while (true) {
      const separator = url.includes('?') ? '&' : '?';
      const response = await this.githubAxios.get(
        `${url}${separator}per_page=100&page=${page}`,
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
      const response = await this.githubAxios.get(
        `${url}${separator}per_page=100&page=${page}`,
      );

      const items = response.data.items || [];
      if (items.length === 0) break;

      results.push(...items);

      if (items.length < 100) break;
      page++;
    }

    return results;
  }

  async getOrgRepos(page?: number, perPage?: number): Promise<any[]> {
    const cacheKey =
      page !== undefined && perPage !== undefined
        ? `org_repos_${this.orgName}_p${page}_pp${perPage}`
        : `org_repos_${this.orgName}`;

    const cached = this.cacheService.get<any[]>(cacheKey);
    if (cached) return cached;

    try {
      const repos =
        page !== undefined && perPage !== undefined
          ? (
              await this.githubAxios.get(
                `/orgs/${this.orgName}/repos?per_page=${perPage}&page=${page}`,
              )
            ).data
          : await this.fetchAllPages(`/orgs/${this.orgName}/repos`);

      this.cacheService.set(cacheKey, repos, CACHE_TTL);
      await this.persistenceService.save(cacheKey, repos);
      return repos;
    } catch (error) {
      this.logger.error(
        `Error fetching repos for ${cacheKey}: ${error.message}. Attempting persistence fallback.`,
      );
      const fallback = await this.persistenceService.load(cacheKey);
      if (fallback) {
        this.logger.log(`Serving stale repo data for key ${cacheKey}`);
        return fallback;
      }
      throw error;
    }
  }

  async getRepoPulls(repoName: string): Promise<any[]> {
    const cacheKey = `pulls_${this.orgName}_${repoName}`;
    const cached = this.cacheService.get<any[]>(cacheKey);
    if (cached) return cached;

    try {
      const pulls = await this.fetchAllPages(
        `/repos/${this.orgName}/${repoName}/pulls`,
      );
      this.cacheService.set(cacheKey, pulls);
      await this.persistenceService.save(cacheKey, pulls);
      return pulls;
    } catch (error) {
      this.logger.error(
        `Error fetching pulls for ${repoName}: ${error.message}. Attempting persistence fallback.`,
      );
      const fallback = await this.persistenceService.load(cacheKey);
      if (fallback) return fallback;
      throw error;
    }
  }

  async getRepoIssues(org: string, repo: string): Promise<any[]> {
    const cacheKey = `issues_${org}_${repo}`;
    const cached = this.cacheService.get<any[]>(cacheKey);
    if (cached) return cached;

    try {
      const issues = await this.fetchAllPages(`/repos/${org}/${repo}/issues`);
      this.cacheService.set(cacheKey, issues);
      await this.persistenceService.save(cacheKey, issues);
      return issues;
    } catch (error) {
      this.logger.error(
        `Error fetching issues for ${repo}: ${error.message}. Attempting persistence fallback.`,
      );
      const fallback = await this.persistenceService.load(cacheKey);
      if (fallback) return fallback;
      throw error;
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
        `/repos/${orgName}/${repoName}/contributors`,
      );
      this.cacheService.set(cacheKey, contributors);
      await this.persistenceService.save(cacheKey, contributors);
      return contributors;
    } catch (error) {
      this.logger.error(
        `Error fetching contributors for ${repoName}: ${error.message}. Attempting persistence fallback.`,
      );
      const fallback = await this.persistenceService.load(cacheKey);
      if (fallback !== null) return fallback;
      return null;
    }
  }

  async searchUserIssues(username: string): Promise<any[]> {
    const normalizedUsername = username.toLowerCase();
    const cacheKey = `search_issues:${normalizedUsername}:${this.orgName}`;
    const cached = this.cacheService.get<any[]>(cacheKey);
    if (cached) return cached;

    try {
      const issues = await this.fetchAllSearchPages(
        `/search/issues?q=author:${username}+org:${this.orgName}+type:issue`,
      );
      this.cacheService.set(cacheKey, issues);
      await this.persistenceService.save(cacheKey, issues);
      return issues;
    } catch (error) {
      this.logger.error(
        `Error searching issues for ${username}: ${error.message}. Attempting persistence fallback.`,
      );
      const fallback = await this.persistenceService.load(cacheKey);
      if (fallback) return fallback;
      throw error;
    }
  }

  async searchUserPullRequests(username: string): Promise<any[]> {
    const normalizedUsername = username.toLowerCase();
    const cacheKey = `search_prs:${normalizedUsername}:${this.orgName}`;
    const cached = this.cacheService.get<any[]>(cacheKey);
    if (cached) return cached;

    const baseQuery = `author:${username} org:${this.orgName} type:pr`;

    try {
      // Parallel searches for merged and unmerged PRs to eliminate N+1 calls
      // This reduces O(N) requests to exactly 2 REST calls (plus pagination)
      const [mergedPrs, unmergedPrs] = await Promise.all([
        this.fetchAllSearchPages(
          `/search/issues?q=${encodeURIComponent(baseQuery + ' is:merged')}`,
        ),
        this.fetchAllSearchPages(
          `/search/issues?q=${encodeURIComponent(baseQuery + ' is:unmerged')}`,
        ),
      ]);

      // Enrich merged PRs with merged_at status using closed_at as proxy (API parity)
      const processedMerged = mergedPrs.map((pr) => ({
        ...pr,
        merged_at: pr.closed_at,
      }));

      const allPrs = [...processedMerged, ...unmergedPrs];

      // Sort by created_at descending to maintain consistent order
      allPrs.sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      );

      this.cacheService.set(cacheKey, allPrs);
      await this.persistenceService.save(cacheKey, allPrs);
      return allPrs;
    } catch (error) {
      this.logger.error(
        `Error searching PRs for ${username}: ${error.message}. Attempting persistence fallback.`,
      );
      const fallback = await this.persistenceService.load(cacheKey);
      if (fallback) return fallback;
      throw error;
    }
  }

  async getUserInfo(accessToken: string): Promise<any> {
    const response = await this.githubAxios.get('/user', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    return response.data;
  }

  async getPublicUserProfile(username: string): Promise<any> {
    const cacheKey = `user_profile_${username}`;
    const cached = this.cacheService.get<any>(cacheKey);
    if (cached) return cached;

    try {
      const response = await this.githubAxios.get(`/users/${username}`);
      const data = response.data;
      this.cacheService.set(cacheKey, data);
      await this.persistenceService.save(cacheKey, data);
      return data;
    } catch (error) {
      this.logger.error(
        `Error fetching user profile for ${username}: ${error.message}. Attempting persistence fallback.`,
      );
      const fallback = await this.persistenceService.load(cacheKey);
      if (fallback) return fallback;
      throw error;
    }
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
        this.githubAxios.get(`/users/${username}/followers`),
        this.githubAxios.get(`/users/${username}/following`),
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

    try {
      const repos = await this.fetchAllSearchPages(
        `/search/repositories?q=${query}+org:${this.orgName}`,
      );

      this.cacheService.set(cacheKey, repos);
      await this.persistenceService.save(cacheKey, repos);
      return repos;
    } catch (error) {
      this.logger.error(
        `Error searching repos for ${query}: ${error.message}. Attempting persistence fallback.`,
      );
      const fallback = await this.persistenceService.load(cacheKey);
      if (fallback) return fallback;
      throw error;
    }
  }
}

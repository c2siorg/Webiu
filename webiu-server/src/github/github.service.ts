import {
  Injectable,
  Logger,
  InternalServerErrorException,
} from '@nestjs/common';
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
  private readonly orgName: string;

  constructor(
    private configService: ConfigService,
    private cacheService: CacheService,
  ) {
    this.accessToken = this.configService.get<string>('GITHUB_ACCESS_TOKEN');
    this.orgName =
      this.configService.get<string>('GITHUB_ORG_NAME') || 'c2siorg';
  }

  private get headers() {
    return {
      Authorization: `token ${this.accessToken}`,
    };
  }

  get org(): string {
    return this.orgName;
  }

  private async getWithRetry<T = any>(
    url: string,
    config: any = {},
  ): Promise<import('axios').AxiosResponse<T>> {
    const maxRetries = 3;
    let attempt = 0;

    while (attempt < maxRetries) {
      try {
        const response = await axios.get<T>(url, {
          ...config,
          headers: {
            ...this.headers,
            ...config.headers,
          },
        });

        const remaining = response.headers
          ? response.headers['x-ratelimit-remaining']
          : undefined;
        if (remaining && parseInt(String(remaining), 10) === 0) {
          const resetTime = response.headers
            ? response.headers['x-ratelimit-reset']
            : undefined;
          if (resetTime) {
            const waitTimeMs =
              parseInt(String(resetTime), 10) * 1000 - Date.now();
            if (waitTimeMs > 0) {
              this.logger.warn(
                `GitHub API limit exhausted. Proactively backing off for ${Math.ceil(
                  waitTimeMs / 1000,
                )} seconds.`,
              );
              await new Promise((resolve) =>
                setTimeout(resolve, waitTimeMs + 1000),
              );
            }
          }
        }

        return response;
      } catch (error) {
        attempt++;
        const axiosError = error as AxiosError;
        const status = axiosError.response?.status;

        if (status === 403 || status === 429) {
          const resHeaders = axiosError.response?.headers || {};
          const retryAfter = resHeaders['retry-after'];
          const resetTime = resHeaders['x-ratelimit-reset'];

          let delayMs = 1000 * Math.pow(2, attempt);

          if (retryAfter) {
            delayMs = parseInt(String(retryAfter), 10) * 1000;
          } else if (resetTime) {
            delayMs = parseInt(String(resetTime), 10) * 1000 - Date.now();
          }

          if (delayMs > 0 && attempt < maxRetries) {
            this.logger.warn(
              `GitHub API rate limit/abuse limit hit (status ${status}). Retrying in ${Math.ceil(
                delayMs / 1000,
              )}s (Attempt ${attempt}/${maxRetries})...`,
            );
            await new Promise((resolve) => setTimeout(resolve, delayMs + 1000));
            continue;
          }
        }

        throw error;
      }
    }

    throw new InternalServerErrorException(
      `GitHub request to ${url} failed after ${maxRetries} attempts`,
    );
  }

  private async githubGet<T = any>(
    url: string,
    ttlSeconds: number = CACHE_TTL,
    cacheKey?: string,
  ): Promise<T> {
    const key = cacheKey || `github_raw_get:${url}`;
    const rawEntry = this.cacheService.getRawEntry<T>(key);

    if (rawEntry && Date.now() <= rawEntry.expiresAt) {
      return rawEntry.data;
    }

    const etag = rawEntry?.etag;
    const headers: Record<string, string> = {};
    if (etag) {
      headers['If-None-Match'] = etag;
    }

    try {
      const response = await this.getWithRetry<T>(url, {
        headers,
        validateStatus: (status) =>
          (status >= 200 && status < 300) || status === 304,
      });

      if (response.status === 304) {
        if (rawEntry) {
          this.cacheService.set(key, rawEntry.data, ttlSeconds, etag);
          return rawEntry.data;
        }
      }

      const newEtag = response.headers ? response.headers['etag'] : undefined;
      this.cacheService.set(key, response.data, ttlSeconds, newEtag);
      return response.data;
    } catch (error) {
      if (rawEntry) {
        this.logger.warn(
          `GitHub API request failed, falling back to cached entry for: ${url}`,
        );
        return rawEntry.data;
      }
      throw error;
    }
  }

  private async fetchAllPages(url: string): Promise<any[]> {
    const results: any[] = [];
    let page = 1;

    while (true) {
      const separator = url.includes('?') ? '&' : '?';
      const pageUrl = `${url}${separator}per_page=100&page=${page}`;
      const data = await this.githubGet<any[]>(pageUrl);

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
      const pageUrl = `${url}${separator}per_page=100&page=${page}`;
      const data = await this.githubGet<any>(pageUrl);

      const items = data.items || [];
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

    let repos: any[] = [];
    try {
      repos = await this.fetchAllPages(
        `${this.baseUrl}/orgs/${this.orgName}/repos`,
      );
    } catch (error) {
      if (error instanceof AxiosError && error.response?.status === 404) {
        this.logger.log(
          `Org ${this.orgName} not found. Trying as user instead...`,
        );
        try {
          repos = await this.fetchAllPages(
            `${this.baseUrl}/users/${this.orgName}/repos`,
          );
        } catch (userError) {
          this.logger.error(
            `Failed to fetch repositories for user ${this.orgName}:`,
            userError.message,
          );
          throw userError;
        }
      } else {
        throw error;
      }
    }

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
      const response = await this.getWithRetry(
        `${this.baseUrl}/repos/${this.orgName}/${repoName}/pulls?state=all&per_page=1`,
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

  async getOrgRepos(page?: number, perPage?: number): Promise<any[]> {
    if (page !== undefined && perPage !== undefined) {
      const cacheKey = `org_repos_${this.orgName}_p${page}_pp${perPage}`;
      try {
        const url = `${this.baseUrl}/orgs/${this.orgName}/repos?per_page=${perPage}&page=${page}`;
        return await this.githubGet<any[]>(url, CACHE_TTL, cacheKey);
      } catch (error) {
        if (error instanceof AxiosError && error.response?.status === 404) {
          const url = `${this.baseUrl}/users/${this.orgName}/repos?per_page=${perPage}&page=${page}`;
          return await this.githubGet<any[]>(url, CACHE_TTL, cacheKey);
        }
        throw error;
      }
    }

    const cacheKey = `org_repos_${this.orgName}`;
    const cached = this.cacheService.get<any[]>(cacheKey);
    if (cached) return cached;

    let repos: any[];
    try {
      repos = await this.fetchAllPages(
        `${this.baseUrl}/orgs/${this.orgName}/repos`,
      );
    } catch (error) {
      if (error instanceof AxiosError && error.response?.status === 404) {
        repos = await this.fetchAllPages(
          `${this.baseUrl}/users/${this.orgName}/repos`,
        );
      } else {
        throw error;
      }
    }
    this.cacheService.set(cacheKey, repos);
    return repos;
  }

  /**
   * Fetches metadata for a single repository.
   * Returns null if the repository is not found (404).
   */
  async getRepo(repoName: string): Promise<GithubRepo | null> {
    const cacheKey = `repo_${this.orgName}_${repoName}`;
    const url = `${this.baseUrl}/repos/${this.orgName}/${repoName}`;
    try {
      return await this.githubGet<GithubRepo>(url, CACHE_TTL, cacheKey);
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
      const response = await this.getWithRetry(
        `${this.baseUrl}/repos/${this.orgName}/${repoName}/stats/commit_activity`,
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
      const response = await this.getWithRetry(
        `${this.baseUrl}/repos/${this.orgName}/${repoName}/stats/participation`,
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
    const url = `${this.baseUrl}/repos/${this.orgName}/${repoName}/releases/latest`;
    try {
      return await this.githubGet(url, CACHE_TTL, cacheKey);
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

  /**
   * Fetches the full language breakdown (bytes per language) for a specific repository.
   * Results are cached to minimize GitHub API quota consumption.
   */
  async getRepoLanguages(repoName: string): Promise<Record<string, number>> {
    const cacheKey = `languages_${this.orgName}_${repoName}`;
    const url = `${this.baseUrl}/repos/${this.orgName}/${repoName}/languages`;
    try {
      return await this.githubGet<Record<string, number>>(
        url,
        CACHE_TTL,
        cacheKey,
      );
    } catch (error: unknown) {
      const axiosErr = error instanceof AxiosError ? error : null;
      this.logger.error(
        `Failed to fetch languages for ${repoName}:`,
        axiosErr?.response?.data || (error as Error).message,
      );
      return {};
    }
  }

  async getRepoContributors(orgName: string, repoName: string): Promise<any[]> {
    const normalizedOrgName = orgName.toLowerCase();
    const normalizedRepoName = repoName.toLowerCase();
    const cacheKey = `contributors_${normalizedOrgName}_${normalizedRepoName}`;

    const cached = this.cacheService.get<any[]>(cacheKey);
    if (cached !== null) {
      return cached;
    }

    try {
      const contributors = await this.fetchAllPages(
        `${this.baseUrl}/repos/${orgName}/${repoName}/contributors`,
      );
      this.cacheService.set(cacheKey, contributors, 600);
      return contributors;
    } catch {
      // Cache empty array with shorter TTL to prevent repeated failed requests
      this.cacheService.set(cacheKey, [], 300);
      return [];
    }
  }

  async searchUserIssues(username: string): Promise<any[]> {
    const normalizedUsername = username.toLowerCase();
    const cacheKey = `search_issues:${normalizedUsername}:${this.orgName}`;
    const cached = this.cacheService.get<any[]>(cacheKey);
    if (cached) return cached;

    const issues = await this.fetchAllSearchPages(
      `${this.baseUrl}/search/issues?q=author:${username}+user:${this.orgName}+type:issue`,
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
      `${this.baseUrl}/search/issues?q=author:${username}+user:${this.orgName}+type:pr`,
    );

    // Fetch details for closed PRs to determine if they were merged
    const enrichedPrs = await Promise.all(
      prs.map(async (pr) => {
        // Only fetch details if closed and we don't know if merged (merged_at missing)
        // Note: Search API results for PRs don't include merged_at at the top level usually
        if (pr.state === 'closed' && !pr.merged_at && pr.pull_request?.url) {
          try {
            const data = await this.githubGet<any>(pr.pull_request.url, 3600);
            if (data.merged_at) {
              pr.merged_at = data.merged_at;
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

  async getPublicUserProfile(username: string): Promise<any> {
    const cacheKey = `user_profile_${username}`;
    const url = `${this.baseUrl}/users/${username}`;
    return this.githubGet(url, 3600 * 24 * 7, cacheKey); // cache for 7 days
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
      // ✅ Correct source of truth: GitHub profile fields (not list endpoints capped at 30)
      const response = await this.getWithRetry(
        `${this.baseUrl}/users/${username}`,
      );

      const result = {
        followers: response.data?.followers ?? 0,
        following: response.data?.following ?? 0,
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
      `${this.baseUrl}/search/repositories?q=${encoded}+user:${this.orgName}`,
    );

    this.cacheService.set(cacheKey, repos);
    return repos;
  }
}

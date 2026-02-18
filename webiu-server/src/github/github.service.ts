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
    } catch (error) {
      console.error('Error in fetching contributors', error);
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
    this.cacheService.set(cacheKey, prs, CACHE_TTL);
    return prs;
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

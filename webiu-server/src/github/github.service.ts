import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

@Injectable()
export class GithubService {
  private readonly baseUrl = 'https://api.github.com';
  private readonly accessToken: string;
  private readonly orgName = 'c2siorg';

  constructor(private configService: ConfigService) {
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

  async getOrgRepos(): Promise<any[]> {
    const response = await axios.get(
      `${this.baseUrl}/orgs/${this.orgName}/repos`,
      { headers: this.headers },
    );
    return response.data;
  }

  async getRepoPulls(repoName: string): Promise<any[]> {
    const response = await axios.get(
      `${this.baseUrl}/repos/${this.orgName}/${repoName}/pulls`,
      { headers: this.headers },
    );
    return response.data;
  }

  async getRepoIssues(org: string, repo: string): Promise<any[]> {
    const response = await axios.get(
      `${this.baseUrl}/repos/${org}/${repo}/issues`,
      { headers: this.headers },
    );
    return response.data;
  }

  async getRepoContributors(
    orgName: string,
    repoName: string,
  ): Promise<any[] | null> {
    try {
      const response = await axios.get(
        `${this.baseUrl}/repos/${orgName}/${repoName}/contributors`,
        { headers: this.headers },
      );
      return response.data;
    } catch (error) {
      console.error('Error in fetching contributors', error);
      return null;
    }
  }

  async searchUserIssues(username: string): Promise<any[]> {
    const response = await axios.get(
      `${this.baseUrl}/search/issues?q=author:${username}+org:${this.orgName}+type:issue`,
      { headers: this.headers },
    );
    return response.data.items || [];
  }

  async searchUserPullRequests(username: string): Promise<any[]> {
    const response = await axios.get(
      `${this.baseUrl}/search/issues?q=author:${username}+org:${this.orgName}+type:pr`,
      { headers: this.headers },
    );
    return response.data.items || [];
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

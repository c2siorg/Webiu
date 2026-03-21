import { Controller, Get, Param, Post } from '@nestjs/common';
import {
  TechStackDetectorService,
  TechStackResult,
} from './tech-stack-detector.service';
import { ConfigService } from '@nestjs/config';
import { CacheService } from '../common/cache.service';
import { GithubService } from './github.service';

@Controller('api/projects')
export class TechStackController {
  private readonly token: string;

  constructor(
    private readonly techStackDetector: TechStackDetectorService,
    private readonly cacheService: CacheService,
    private readonly configService: ConfigService,
    private readonly githubService: GithubService,
  ) {
    this.token = this.configService.get<string>('GITHUB_ACCESS_TOKEN');
  }

  @Get('tech-stack/:org/:repo')
  async getTechStack(
    @Param('org') org: string,
    @Param('repo') repo: string,
  ): Promise<TechStackResult> {
    const cacheKey = `tech_stack:${org}:${repo}`;
    const cached = this.cacheService.get<TechStackResult>(cacheKey);
    if (cached) return cached;

    // Get repo info to check pushed_at
    const repos = await this.githubService.getOrgRepos();
    const repoInfo = repos.find((r) => r.name === repo);
    const pushedAt = repoInfo?.pushed_at || new Date().toISOString();

    const result = await this.techStackDetector.detectTechStack(
      org,
      repo,
      pushedAt,
      this.token,
    );

    // Cache using pushed_at as version — only re-detect if repo was updated
    this.cacheService.set(cacheKey, result, 3600);
    return result;
  }

  @Post('tech-stack/refresh/:org/:repo')
  async refreshTechStack(
    @Param('org') org: string,
    @Param('repo') repo: string,
  ): Promise<TechStackResult> {
    const cacheKey = `tech_stack:${org}:${repo}`;
    this.cacheService.delete(cacheKey);

    const repos = await this.githubService.getOrgRepos();
    const repoInfo = repos.find((r) => r.name === repo);
    const pushedAt = repoInfo?.pushed_at || new Date().toISOString();

    const result = await this.techStackDetector.detectTechStack(
      org,
      repo,
      pushedAt,
      this.token,
    );

    this.cacheService.set(cacheKey, result, 3600);
    return result;
  }
}

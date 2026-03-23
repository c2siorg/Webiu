import { Controller, Get, Param, Post, Logger } from '@nestjs/common';
import {
  TechStackDetectorService,
  TechStackResult,
} from './tech-stack-detector.service';
import { CacheService } from '../common/cache.service';
import { GithubService } from './github.service';

@Controller('api/v1/tech-stack')
export class TechStackController {
  private readonly logger = new Logger(TechStackController.name);

  constructor(
    private readonly techStackDetector: TechStackDetectorService,
    private readonly cacheService: CacheService,
    private readonly githubService: GithubService,
  ) {}

  @Get(':org/:repo')
  async getTechStack(
    @Param('org') org: string,
    @Param('repo') repo: string,
  ): Promise<TechStackResult> {
    // Use cached org repos to get pushed_at without extra API call
    const repos = await this.githubService.getOrgRepos();
    const repoInfo = repos.find(
      (r) => r.name === repo && r.full_name === `${org}/${repo}`,
    );
    const pushedAt = repoInfo?.pushed_at || new Date().toISOString();

    const cacheKey = `tech_stack:${org}:${repo}:${pushedAt}`;
    const cached = this.cacheService.get<TechStackResult>(cacheKey);
    if (cached) return cached;

    const result = await this.techStackDetector.detectTechStack(
      org,
      repo,
      pushedAt,
    );

    this.cacheService.set(cacheKey, result, 3600);
    return result;
  }

  @Post('refresh/:org/:repo')
  async refreshTechStack(
    @Param('org') org: string,
    @Param('repo') repo: string,
  ): Promise<TechStackResult> {
    const repos = await this.githubService.getOrgRepos();
    const repoInfo = repos.find(
      (r) => r.name === repo && r.full_name === `${org}/${repo}`,
    );
    const pushedAt = repoInfo?.pushed_at || new Date().toISOString();

    const cacheKey = `tech_stack:${org}:${repo}:${pushedAt}`;
    this.cacheService.delete(cacheKey);

    const result = await this.techStackDetector.detectTechStack(
      org,
      repo,
      pushedAt,
    );

    this.cacheService.set(cacheKey, result, 3600);
    return result;
  }
}

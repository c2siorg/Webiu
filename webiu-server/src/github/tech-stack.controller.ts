import { Controller, Get, Param, Post, Logger } from '@nestjs/common';
import {
  TechStackDetectorService,
  TechStackResult,
} from './tech-stack-detector.service';
import { ConfigService } from '@nestjs/config';
import { CacheService } from '../common/cache.service';
import axios from 'axios';

@Controller('api/v1/projects')
export class TechStackController {
  private readonly token: string;
  private readonly logger = new Logger(TechStackController.name);
  private readonly baseUrl = 'https://api.github.com';

  constructor(
    private readonly techStackDetector: TechStackDetectorService,
    private readonly cacheService: CacheService,
    private readonly configService: ConfigService,
  ) {
    this.token = this.configService.get<string>('GITHUB_ACCESS_TOKEN');
  }

  private async getRepoPushedAt(org: string, repo: string): Promise<string> {
    try {
      const response = await axios.get(`${this.baseUrl}/repos/${org}/${repo}`, {
        headers: { Authorization: `token ${this.token}` },
      });
      return response.data.pushed_at || new Date().toISOString();
    } catch (err) {
      this.logger.warn(
        `Failed to fetch repo metadata for ${org}/${repo}: ${err.message}`,
      );
      return new Date().toISOString();
    }
  }

  @Get('tech-stack/:org/:repo')
  async getTechStack(
    @Param('org') org: string,
    @Param('repo') repo: string,
  ): Promise<TechStackResult> {
    const pushedAt = await this.getRepoPushedAt(org, repo);
    const cacheKey = `tech_stack:${org}:${repo}:${pushedAt}`;

    const cached = this.cacheService.get<TechStackResult>(cacheKey);
    if (cached) return cached;

    const result = await this.techStackDetector.detectTechStack(
      org,
      repo,
      pushedAt,
      this.token,
    );

    this.cacheService.set(cacheKey, result, 3600);
    return result;
  }

  @Post('tech-stack/refresh/:org/:repo')
  async refreshTechStack(
    @Param('org') org: string,
    @Param('repo') repo: string,
  ): Promise<TechStackResult> {
    const pushedAt = await this.getRepoPushedAt(org, repo);
    const cacheKey = `tech_stack:${org}:${repo}:${pushedAt}`;

    this.cacheService.delete(cacheKey);

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

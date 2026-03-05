import { Controller, Get, Query, Header, Param } from '@nestjs/common';
import { ProjectService } from './project.service';

@Controller('api/v1/projects')
export class ProjectController {
  constructor(private projectService: ProjectService) {}

  @Get()
  @Header('Cache-Control', 'public, max-age=300')
  async getAllProjects(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
  ) {
    const pageNum = Math.max(1, parseInt(page as any, 10) || 1);
    const limitNum = Math.min(
      100,
      Math.max(1, parseInt(limit as any, 10) || 10),
    );
    return this.projectService.getAllProjects(pageNum, limitNum);
  }

  /**
   * GET /api/v1/projects/search?q=...&page=1&limit=10
   * Searches repositories using in-memory filtering of cached org repos.
   * Must be declared before :name to avoid being captured by the wildcard.
   */
  @Get('search')
  @Header('Cache-Control', 'public, max-age=300')
  async searchProjects(
    @Query('q') query: string,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
  ) {
    if (!query) {
      return { total: 0, page: 1, limit: 10, repositories: [] };
    }

    const pageNum = Math.max(1, parseInt(page as any, 10) || 1);
    const limitNum = Math.min(
      100,
      Math.max(1, parseInt(limit as any, 10) || 10),
    );
    return this.projectService.searchProjects(query, pageNum, limitNum);
  }

  @Get('tech-stack/:repo')
  @Header('Cache-Control', 'public, max-age=300')
  async getRepoTechStack(@Param('repo') repo: string) {
    return this.projectService.getRepoTechStack(repo);
  }

  /**
   * GET /api/v1/projects/:name
   * Returns metadata and tech stack for a specific project.
   */
  @Get(':name')
  @Header('Cache-Control', 'public, max-age=300')
  async getProjectByName(@Param('name') name: string) {
    return this.projectService.getProjectByName(name);
  }

  /**
   * GET /api/v1/projects/:name/insights
   * Returns analytical insights, badges, and commit activity for a project.
   */
  @Get(':name/insights')
  @Header('Cache-Control', 'public, max-age=300')
  async getProjectInsights(@Param('name') name: string) {
    return this.projectService.getProjectInsights(name);
  }

  /**
   * GET /api/v1/projects/:name/contributors
   * Returns the list of contributors for a project.
   */
  @Get(':name/contributors')
  @Header('Cache-Control', 'public, max-age=300')
  async getProjectContributors(@Param('name') name: string) {
    return this.projectService.getProjectContributors(name);
  }
}

@Controller('api/v1/issues')
export class IssuesController {
  constructor(private projectService: ProjectService) {}

  @Get('issuesAndPr')
  @Header('Cache-Control', 'public, max-age=300')
  async getIssuesAndPr(@Query('org') org: string, @Query('repo') repo: string) {
    return this.projectService.getIssuesAndPr(org, repo);
  }
}

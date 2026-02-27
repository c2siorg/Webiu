import { Controller, Get, Query, Header, Param } from '@nestjs/common';
import { ProjectService } from './project.service';
import { OrgRepoQueryDto } from './dto/org-repo-query.dto';

@Controller('api/projects')
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
   * GET /api/projects/search?q=...&page=1&limit=10
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

  /**
   * GET /api/projects/:name
   * Returns metadata and tech stack for a specific project.
   */
  @Get(':name')
  @Header('Cache-Control', 'public, max-age=300')
  async getProjectByName(@Param('name') name: string) {
    return this.projectService.getProjectByName(name);
  }

  /**
   * GET /api/projects/:name/insights
   * Returns analytical insights, badges, and commit activity for a project.
   */
  @Get(':name/insights')
  @Header('Cache-Control', 'public, max-age=300')
  async getProjectInsights(@Param('name') name: string) {
    return this.projectService.getProjectInsights(name);
  }

  /**
   * GET /api/projects/:name/contributors
   * Returns the list of contributors for a project.
   */
  @Get(':name/contributors')
  @Header('Cache-Control', 'public, max-age=300')
  async getProjectContributors(@Param('name') name: string) {
    return this.projectService.getProjectContributors(name);
  }
}

@Controller('api/issues')
export class IssuesController {
  constructor(private projectService: ProjectService) {}

  @Get('issuesAndPr')
  @Header('Cache-Control', 'public, max-age=300')
  async getIssuesAndPr(@Query() { org, repo }: OrgRepoQueryDto) {
    return this.projectService.getIssuesAndPr(org, repo);
  }
}

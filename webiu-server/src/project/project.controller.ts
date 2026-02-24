import { Controller, Get, Query, Header, Param } from '@nestjs/common';
import { ProjectService } from './project.service';

@Controller('api/projects')
export class ProjectController {
  constructor(private projectService: ProjectService) {}

  @Get('projects')
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
  @Header('Cache-Control', 'no-store, no-cache, must-revalidate')
  async getProjectInsights(@Param('name') name: string) {
    return this.projectService.getProjectInsights(name);
  }
}

@Controller('api/issues')
export class IssuesController {
  constructor(private projectService: ProjectService) {}

  @Get('issuesAndPr')
  @Header('Cache-Control', 'public, max-age=300')
  async getIssuesAndPr(@Query('org') org: string, @Query('repo') repo: string) {
    return this.projectService.getIssuesAndPr(org, repo);
  }
}

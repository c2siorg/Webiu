import { Controller, Get, Query, Header } from '@nestjs/common';
import { ProjectService } from './project.service';

@Controller('api/projects')
export class ProjectController {
  constructor(private projectService: ProjectService) { }

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
}

@Controller('api/issues')
export class IssuesController {
  constructor(private projectService: ProjectService) { }

  @Get('issuesAndPr')
  @Header('Cache-Control', 'public, max-age=300')
  async getIssuesAndPr(@Query('org') org: string, @Query('repo') repo: string) {
    return this.projectService.getIssuesAndPr(org, repo);
  }
}

import { Controller, Get, Query, Param, Header } from '@nestjs/common';
import { ProjectService } from './project.service';

@Controller('api/projects')
export class ProjectController {
  constructor(private projectService: ProjectService) {}

  @Get('projects')
  @Header('Cache-Control', 'public, max-age=300')
  async getAllProjects() {
    return this.projectService.getAllProjects();
  }

  @Get('tech-stack/:repo')
  @Header('Cache-Control', 'public, max-age=300')
  async getRepoTechStack(@Param('repo') repo: string) {
    return this.projectService.getRepoTechStack(repo);
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

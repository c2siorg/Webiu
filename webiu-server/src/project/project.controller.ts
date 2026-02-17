import { Controller, Get, Query } from '@nestjs/common';
import { ProjectService } from './project.service';

@Controller('api/projects')
export class ProjectController {
  constructor(private projectService: ProjectService) {}

  @Get('projects')
  async getAllProjects() {
    return this.projectService.getAllProjects();
  }
}

@Controller('api/issues')
export class IssuesController {
  constructor(private projectService: ProjectService) {}

  @Get('issuesAndPr')
  async getIssuesAndPr(
    @Query('org') org: string,
    @Query('repo') repo: string,
  ) {
    return this.projectService.getIssuesAndPr(org, repo);
  }
}

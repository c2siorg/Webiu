import { Controller, Get, Query, Header } from '@nestjs/common';
import { ProjectService } from './project.service';
import { OrgRepoQueryDto } from './dto/org-repo-query.dto';

@Controller('api/projects')
export class ProjectController {
  constructor(private projectService: ProjectService) {}

  @Get('projects')
  @Header('Cache-Control', 'public, max-age=300')
  async getAllProjects() {
    return this.projectService.getAllProjects();
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

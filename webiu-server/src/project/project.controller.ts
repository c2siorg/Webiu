import { Controller, Get, Query, Header } from '@nestjs/common';
import { ProjectService } from './project.service';
import { PaginationQueryDto } from './dto/pagination-query.dto';

@Controller('api/projects')
export class ProjectController {
  constructor(private projectService: ProjectService) { }

  @Get('projects')
  @Header('Cache-Control', 'public, max-age=300')
  async getAllProjects(@Query() query: PaginationQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    return this.projectService.getAllProjects(page, limit);
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

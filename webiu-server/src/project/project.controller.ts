import { Controller, Get, Query, Header } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { ProjectService } from './project.service';

@ApiTags('Projects')
@Controller('api/projects')
export class ProjectController {
  constructor(private projectService: ProjectService) {}

  @Get('projects')
  @Header('Cache-Control', 'public, max-age=300')
  @ApiOperation({ summary: 'Get all projects (paginated)' })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Page number (default: 1)',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Items per page (default: 10)',
  })
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

@ApiTags('Issues')
@Controller('api/issues')
export class IssuesController {
  constructor(private projectService: ProjectService) {}

  @Get('issuesAndPr')
  @Header('Cache-Control', 'public, max-age=300')
  @ApiOperation({ summary: 'Get issue and pull-request counts for a repo' })
  @ApiQuery({
    name: 'org',
    required: true,
    type: String,
    description: 'GitHub organization name',
  })
  @ApiQuery({
    name: 'repo',
    required: true,
    type: String,
    description: 'Repository name',
  })
  async getIssuesAndPr(@Query('org') org: string, @Query('repo') repo: string) {
    return this.projectService.getIssuesAndPr(org, repo);
  }
}

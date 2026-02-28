import { Resolver, Query, Args, Int } from '@nestjs/graphql';
import { Project, ProjectConnection } from '../types';
import { ProjectService } from '../../project/project.service';

@Resolver(() => Project)
export class ProjectResolver {
  constructor(private readonly projectService: ProjectService) {}

  @Query(() => ProjectConnection)
  async projects(
    @Args('page', { type: () => Int, defaultValue: 1 }) page: number,
    @Args('limit', { type: () => Int, defaultValue: 10 }) limit: number,
  ): Promise<ProjectConnection> {
    const result = await this.projectService.getAllProjects(page, limit);

    const projects: Project[] = result.repositories.map((repo: any) => ({
      id: repo.id?.toString() || repo.name,
      name: repo.name,
      description: repo.description,
      stars: repo.stargazers_count || repo.stars || 0,
      forks: repo.forks_count || repo.forks || 0,
      language: repo.language,
      topics: repo.topics,
      url: repo.url,
      html_url: repo.html_url,
      open_issues: repo.open_issues_count || repo.open_issues || 0,
      pull_requests: repo.pull_requests || 0,
      owner: repo.owner?.login || repo.owner,
      created_at: repo.created_at,
      updated_at: repo.updated_at,
    }));

    return {
      total: result.total,
      page: result.page,
      limit: result.limit,
      repositories: projects,
    };
  }

  @Query(() => Project, { nullable: true })
  async projectById(@Args('id') id: string): Promise<Project | null> {
    const result = await this.projectService.getAllProjects(1, 100);
    const repo = result.repositories.find(
      (r: any) => r.id?.toString() === id || r.name === id,
    );

    if (!repo) return null;

    return {
      id: repo.id?.toString() || repo.name,
      name: repo.name,
      description: repo.description,
      stars: repo.stargazers_count || repo.stars || 0,
      forks: repo.forks_count || repo.forks || 0,
      language: repo.language,
      topics: repo.topics,
      url: repo.url,
      html_url: repo.html_url,
      open_issues: repo.open_issues_count || repo.open_issues || 0,
      pull_requests: repo.pull_requests || 0,
      owner: repo.owner?.login || repo.owner,
      created_at: repo.created_at,
      updated_at: repo.updated_at,
    };
  }
}

import { Resolver, Query, Args, Int } from '@nestjs/graphql';
import { ProjectService } from '../project/project.service';
import { Repository } from './models/repository.model';

@Resolver(() => Repository)
export class ProjectResolver {
  constructor(private projectService: ProjectService) {}

  @Query(() => [Repository])
  async repositories(
    @Args('page', { type: () => Int, defaultValue: 1 }) page: number,
    @Args('limit', { type: () => Int, defaultValue: 10 }) limit: number,
  ): Promise<Repository[]> {
    const result = await this.projectService.getAllProjects(page, limit);
    return result?.repositories ?? [];
  }

  @Query(() => Repository, { nullable: true })
  async projectById(@Args('id') id: string): Promise<Repository | null> {
    const result = await this.projectService.getAllProjects(1, 100);
    const repo = result.repositories.find(
      (r) => r.id?.toString() === id || r.name === id,
    );
    if (!repo) return null;

    return {
      name: repo.name,
      description: repo.description,
      html_url: repo.html_url,
      language: repo.language,
      stargazers_count: repo.stargazers_count || 0,
      forks_count: repo.forks_count || 0,
      pull_requests: repo.pull_requests || 0,
    };
  }
}

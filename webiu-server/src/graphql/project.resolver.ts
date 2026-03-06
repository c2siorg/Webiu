import { Resolver, Query, Args, Int } from '@nestjs/graphql';
import { ProjectService } from '../project/project.service';
import { PaginatedRepositories } from './models/repository.model';

@Resolver()
export class ProjectResolver {
  constructor(private projectService: ProjectService) {}

  @Query(() => PaginatedRepositories)
  async repositories(
    @Args('page', { type: () => Int, defaultValue: 1 }) page: number,
    @Args('limit', { type: () => Int, defaultValue: 10 }) limit: number,
  ): Promise<PaginatedRepositories> {
    return this.projectService.getAllProjects(page, limit);
  }

  @Query(() => PaginatedRepositories)
  async searchRepositories(
    @Args('query') query: string,
    @Args('page', { type: () => Int, defaultValue: 1 }) page: number,
    @Args('limit', { type: () => Int, defaultValue: 10 }) limit: number,
  ): Promise<PaginatedRepositories> {
    return this.projectService.searchProjects(query, page, limit);
  }
}

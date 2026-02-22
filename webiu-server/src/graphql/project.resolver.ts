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
}

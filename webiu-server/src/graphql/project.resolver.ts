import { Resolver, Query } from '@nestjs/graphql';
import { SkipThrottle } from '@nestjs/throttler';
import { ProjectService } from '../project/project.service';
import { Repository } from './models/repository.model';

// ThrottlerGuard reads the client IP from the HTTP request object, which is
// not available in the GraphQL execution context. Throttling is still enforced
// at the REST layer for the underlying service calls.
@SkipThrottle()
@Resolver(() => Repository)
export class ProjectResolver {
  constructor(private projectService: ProjectService) {}

  @Query(() => [Repository])
  async repositories(): Promise<Repository[]> {
    const result = await this.projectService.getAllProjects();
    return result?.repositories ?? [];
  }
}

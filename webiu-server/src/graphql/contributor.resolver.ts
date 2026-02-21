import { Resolver, Query } from '@nestjs/graphql';
import { SkipThrottle } from '@nestjs/throttler';
import { ContributorService } from '../contributor/contributor.service';
import { Contributor } from './models/contributor.model';

// ThrottlerGuard reads the client IP from the HTTP request object, which is
// not available in the GraphQL execution context. Throttling is still enforced
// at the REST layer for the underlying service calls.
@SkipThrottle()
@Resolver(() => Contributor)
export class ContributorResolver {
  constructor(private contributorService: ContributorService) {}

  @Query(() => [Contributor])
  async contributors() {
    return this.contributorService.getAllContributors();
  }
}

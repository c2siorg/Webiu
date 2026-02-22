import { Resolver, Query } from '@nestjs/graphql';
import { ContributorService } from '../contributor/contributor.service';
import { Contributor } from './models/contributor.model';

@Resolver(() => Contributor)
export class ContributorResolver {
  constructor(private contributorService: ContributorService) {}

  @Query(() => [Contributor])
  async contributors() {
    return this.contributorService.getAllContributors();
  }
}

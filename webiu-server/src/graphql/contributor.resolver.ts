import { Resolver, Query, Args, Int, Extensions } from '@nestjs/graphql';
import { ContributorService } from '../contributor/contributor.service';
import { Contributor } from './models/contributor.model';

@Resolver(() => Contributor)
export class ContributorResolver {
  constructor(private contributorService: ContributorService) {}

  @Query(() => [Contributor])
  @Extensions({ complexity: 20 })
  async contributors(
    @Args('page', { type: () => Int, defaultValue: 1 }) page: number,
    @Args('limit', { type: () => Int, defaultValue: 30 }) limit: number,
  ): Promise<Contributor[]> {
    const all =
      (await this.contributorService.getAllContributors()) as Contributor[];
    const start = (page - 1) * limit;
    return all.slice(start, start + limit);
  }
}

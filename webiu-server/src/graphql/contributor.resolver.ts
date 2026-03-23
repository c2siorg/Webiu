import { Resolver, Query, Args, Int } from '@nestjs/graphql';
import { BadRequestException } from '@nestjs/common';
import { ContributorService } from '../contributor/contributor.service';
import { Contributor } from './models/contributor.model';

@Resolver(() => Contributor)
export class ContributorResolver {
  constructor(private contributorService: ContributorService) {}

  @Query(() => [Contributor])
  async contributors(
    @Args('page', { type: () => Int, defaultValue: 1 }) page: number,
    @Args('limit', { type: () => Int, defaultValue: 30 }) limit: number,
  ): Promise<Contributor[]> {
    if (page < 1) throw new BadRequestException('page must be at least 1');
    if (limit < 1 || limit > 100)
      throw new BadRequestException('limit must be between 1 and 100');

    const result = await this.contributorService.getPaginatedContributors(
      page,
      limit,
    );
    return result.contributors as Contributor[];
  }
}

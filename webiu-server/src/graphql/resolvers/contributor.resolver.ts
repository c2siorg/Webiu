import { Resolver, Query, Args } from '@nestjs/graphql';
import { Contributor } from '../types';
import { ContributorService } from '../../contributor/contributor.service';

@Resolver(() => Contributor)
export class ContributorResolver {
  constructor(private readonly contributorService: ContributorService) {}

  @Query(() => [Contributor])
  async contributors(): Promise<Contributor[]> {
    const result =
      (await this.contributorService.getAllContributors()) as any[];

    return result.map((contributor: any) => ({
      id: contributor.login,
      login: contributor.login,
      avatar_url: contributor.avatar_url,
      html_url:
        contributor.html_url || `https://github.com/${contributor.login}`,
      contributions: contributor.contributions,
      repos: contributor.repos,
      type: contributor.type,
      site_admin: contributor.site_admin,
    }));
  }

  @Query(() => Contributor, { nullable: true })
  async contributorByUsername(
    @Args('username') username: string,
  ): Promise<Contributor | null> {
    const result =
      (await this.contributorService.getAllContributors()) as any[];
    const contributor = result.find(
      (c: any) => c.login.toLowerCase() === username.toLowerCase(),
    );

    if (!contributor) return null;

    return {
      id: contributor.login,
      login: contributor.login,
      avatar_url: contributor.avatar_url,
      html_url:
        contributor.html_url || `https://github.com/${contributor.login}`,
      contributions: contributor.contributions,
      repos: contributor.repos,
      type: contributor.type,
      site_admin: contributor.site_admin,
    };
  }
}

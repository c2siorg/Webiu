import { Resolver, Query, Args, Extensions } from '@nestjs/graphql';
import { GithubGraphqlService } from '../github/github.graphql.service';
import { PullRequest } from './models/pull-request.model';

@Resolver()
export class GithubGraphqlResolver {
  constructor(private githubGraphqlService: GithubGraphqlService) {}

  @Query(() => [PullRequest])
  @Extensions({ complexity: 5 })
  async searchUserPullRequests(@Args('username') username: string) {
    return this.githubGraphqlService.searchUserPullRequests(username);
  }
}

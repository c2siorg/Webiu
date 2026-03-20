import { Module } from '@nestjs/common';
import { GithubService } from './github.service';
import { GithubGraphqlService } from './github.graphql.service';

@Module({
  providers: [GithubService, GithubGraphqlService],
  exports: [GithubService, GithubGraphqlService],
})
export class GithubModule {}

import { Module, Global } from '@nestjs/common';
import { GithubService } from './github.service';
import { GithubGraphqlService } from './github.graphql.service';

@Global()
@Module({
  providers: [GithubService, GithubGraphqlService],
  exports: [GithubService, GithubGraphqlService],
})
export class GithubModule {}

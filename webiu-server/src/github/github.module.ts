import { Module, Global } from '@nestjs/common';
import { GithubService } from './github.service';
import { ConfigModule } from '@nestjs/config';
import { GithubGraphqlService } from './github.graphql.service';
import { CacheService } from '../common/cache.service';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [GithubService, GithubGraphqlService, CacheService],
  exports: [GithubService, GithubGraphqlService],
})
export class GithubModule {}

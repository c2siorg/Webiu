import { Module, Global } from '@nestjs/common';
import { GithubService } from './github.service';

@Global()
@Module({
  providers: [GithubService],
  exports: [GithubService],
})
export class GithubModule {}

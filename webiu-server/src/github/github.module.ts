import { Module, Global } from '@nestjs/common';
import { GithubService } from './github.service';
import { TechStackDetectorService } from './tech-stack-detector.service';
import { TechStackController } from './tech-stack.controller';

@Global()
@Module({
  controllers: [TechStackController],
  providers: [GithubService, TechStackDetectorService],
  exports: [GithubService, TechStackDetectorService],
})
export class GithubModule {}

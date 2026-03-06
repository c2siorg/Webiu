import { Module } from '@nestjs/common';
import { ProjectController, IssuesController } from './project.controller';
import { ProjectService } from './project.service';
import { GithubModule } from '../github/github.module';

@Module({
  imports: [GithubModule],
  controllers: [ProjectController, IssuesController],
  providers: [ProjectService],
  exports: [ProjectService],
})
export class ProjectModule {}

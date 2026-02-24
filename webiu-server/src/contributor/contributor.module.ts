import { Module } from '@nestjs/common';
import { ContributorController } from './contributor.controller';
import { ContributorService } from './contributor.service';
import { GithubModule } from '../github/github.module';

@Module({
  imports: [GithubModule],
  controllers: [ContributorController],
  providers: [ContributorService],
  exports: [ContributorService],
})
export class ContributorModule {}

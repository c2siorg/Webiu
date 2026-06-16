import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ContributorController } from './contributor.controller';
import { ContributorService } from './contributor.service';
import { GithubModule } from '../github/github.module';
import { Contributor } from '../database/entities/contributor.entity';
import { RepositoryContributor } from '../database/entities/repository-contributor.entity';

@Module({
  imports: [
    GithubModule,
    TypeOrmModule.forFeature([Contributor, RepositoryContributor]),
  ],
  controllers: [ContributorController],
  providers: [ContributorService],
  exports: [ContributorService],
})
export class ContributorModule {}

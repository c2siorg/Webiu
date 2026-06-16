import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProjectController, IssuesController } from './project.controller';
import { ProjectService } from './project.service';
import { RepositorySyncService } from './repository-sync.service';
import { RepositoryReconciliationService } from './repository-reconciliation.service';
import { GithubModule } from '../github/github.module';
import { Repository as RepositoryEntity } from '../database/entities/repository.entity';

@Module({
  imports: [GithubModule, TypeOrmModule.forFeature([RepositoryEntity])],
  controllers: [ProjectController, IssuesController],
  providers: [
    ProjectService,
    RepositorySyncService,
    RepositoryReconciliationService,
  ],
  exports: [
    ProjectService,
    RepositorySyncService,
    RepositoryReconciliationService,
  ],
})
export class ProjectModule {}

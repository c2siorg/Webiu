import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Contributor } from '../database/entities/contributor.entity';
import { Repository as RepositoryEntity } from '../database/entities/repository.entity';
import { RepositoryContributor } from '../database/entities/repository-contributor.entity';
import { AuthModule } from '../auth/auth.module';
import { AnalyticsController } from './analytics.controller';
import { ContributorAnalyticsService } from './contributor-analytics.service';
import { RepositoryAnalyticsController } from './repository-analytics.controller';
import { RepositoryAnalyticsService } from './repository-analytics.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Contributor,
      RepositoryEntity,
      RepositoryContributor,
    ]),
    AuthModule,
  ],
  controllers: [AnalyticsController, RepositoryAnalyticsController],
  providers: [ContributorAnalyticsService, RepositoryAnalyticsService],
})
export class AnalyticsModule {}

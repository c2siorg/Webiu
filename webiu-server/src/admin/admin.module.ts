import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { AuthModule } from '../auth/auth.module';
import { ProjectModule } from '../project/project.module';
import { ContributorModule } from '../contributor/contributor.module';
import { GithubModule } from '../github/github.module';

@Module({
  imports: [AuthModule, ProjectModule, ContributorModule, GithubModule],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}

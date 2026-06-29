import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Repository as RepositoryEntity } from '../database/entities/repository.entity';
import { Contributor } from '../database/entities/contributor.entity';
import { GsocProgram } from '../database/entities/gsoc-program.entity';
import { GsocIdea } from '../database/entities/gsoc-idea.entity';
import { GsocMentor } from '../database/entities/gsoc-mentor.entity';
import { Admin } from '../database/entities/admin.entity';
import { AuthModule } from '../auth/auth.module';
import { AuditLogModule } from '../audit-log/audit-log.module';
import { SystemSettingModule } from '../system-setting/system-setting.module';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      RepositoryEntity,
      Contributor,
      GsocProgram,
      GsocIdea,
      GsocMentor,
      Admin,
    ]),
    AuthModule,
    AuditLogModule,
    SystemSettingModule,
  ],
  controllers: [DashboardController],
  providers: [DashboardService],
  exports: [DashboardService],
})
export class DashboardModule {}

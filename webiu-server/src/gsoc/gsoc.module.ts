import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GsocProgram } from '../database/entities/gsoc-program.entity';
import { GsocIdea } from '../database/entities/gsoc-idea.entity';
import { GsocMentor } from '../database/entities/gsoc-mentor.entity';
import { GsocProgramService } from './gsoc-program.service';
import { GsocIdeaService } from './gsoc-idea.service';
import { GsocMentorService } from './gsoc-mentor.service';
import { AdminGsocController } from './admin-gsoc.controller';
import { PublicGsocController } from './public-gsoc.controller';
import { SystemSettingModule } from '../system-setting/system-setting.module';
import { AuthModule } from '../auth/auth.module';
import { AuditLogModule } from '../audit-log/audit-log.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([GsocProgram, GsocIdea, GsocMentor]),
    SystemSettingModule,
    AuthModule,
    AuditLogModule,
  ],
  controllers: [AdminGsocController, PublicGsocController],
  providers: [GsocProgramService, GsocIdeaService, GsocMentorService],
  exports: [GsocProgramService, GsocIdeaService, GsocMentorService],
})
export class GsocModule {}

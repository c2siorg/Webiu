import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Admin } from '../database/entities/admin.entity';
import { AuthModule } from '../auth/auth.module';
import { AuditLogModule } from '../audit-log/audit-log.module';
import { AdminProfileController } from './admin-profile.controller';
import { AdminProfileService } from './admin-profile.service';

@Module({
  imports: [TypeOrmModule.forFeature([Admin]), AuthModule, AuditLogModule],
  controllers: [AdminProfileController],
  providers: [AdminProfileService],
  exports: [AdminProfileService],
})
export class AdminProfileModule {}

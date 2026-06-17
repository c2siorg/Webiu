import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SystemSetting } from '../database/entities/system-setting.entity';
import { SystemSettingService } from './system-setting.service';
import { SystemSettingController } from './system-setting.controller';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [TypeOrmModule.forFeature([SystemSetting]), AuthModule],
  controllers: [SystemSettingController],
  providers: [SystemSettingService],
  exports: [SystemSettingService],
})
export class SystemSettingModule {}

import { Controller, Get, Patch, Body, UseGuards } from '@nestjs/common';
import { SystemSettingService } from './system-setting.service';
import { AdminGuard } from '../auth/guards/admin.guard';

@Controller('admin/settings')
@UseGuards(AdminGuard)
export class SystemSettingController {
  constructor(private readonly settingService: SystemSettingService) {}

  @Get()
  async getSettings() {
    const settings = await this.settingService.getAllSettings();
    return { success: true, settings };
  }

  @Patch()
  async updateSettings(@Body() updates: Record<string, any>) {
    const settings = await this.settingService.updateSettings(updates);
    return {
      success: true,
      message: 'Settings updated successfully.',
      settings,
    };
  }
}

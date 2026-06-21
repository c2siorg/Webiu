import { Controller, Get, Patch, Body, UseGuards, Req } from '@nestjs/common';
import { SystemSettingService } from './system-setting.service';
import { AdminGuard } from '../auth/guards/admin.guard';

@Controller('admin/settings')
export class SystemSettingController {
  constructor(private readonly settingService: SystemSettingService) {}

  @Get()
  @UseGuards(AdminGuard)
  async getSettings() {
    const settings = await this.settingService.getAllSettings();
    return { success: true, settings };
  }

  @Patch()
  @UseGuards(AdminGuard)
  async updateSettings(@Req() req: any, @Body() updates: Record<string, any>) {
    const settings = await this.settingService.updateSettings(
      updates,
      req.user.id,
    );
    return {
      success: true,
      message: 'Settings updated successfully.',
      settings,
    };
  }

  @Get('public')
  async getPublicSettings() {
    const settings = await this.settingService.getAllSettings();
    return { success: true, settings };
  }
}

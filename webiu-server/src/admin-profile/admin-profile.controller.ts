import {
  Controller,
  Get,
  Patch,
  Body,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { ConfigService } from '@nestjs/config';
import { AdminGuard } from '../auth/guards/admin.guard';
import { AdminProfileService } from './admin-profile.service';
import { UpdateUsernameDto } from './dto/update-username.dto';
import { UpdatePasswordDto } from './dto/update-password.dto';
import { getCookieOptions } from '../common/utils/cookie-helper';

@Controller('admin/profile')
@UseGuards(AdminGuard)
export class AdminProfileController {
  constructor(
    private readonly profileService: AdminProfileService,
    private readonly configService: ConfigService,
  ) {}

  @Get()
  async getProfile(@Req() req: any) {
    const username = req.user.username;
    const admin = await this.profileService.getProfile(username);
    return {
      username: admin.username,
      role: 'administrator',
      createdAt: admin.createdAt,
      lastLoginAt: admin.lastLoginAt,
    };
  }

  @Patch('username')
  async updateUsername(
    @Req() req: any,
    @Body() dto: UpdateUsernameDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    const currentUsername = req.user.username;
    await this.profileService.updateUsername(
      currentUsername,
      dto.username,
      req.user.id,
    );

    this.clearSessionCookie(req, response);

    return {
      success: true,
      message: 'Username updated successfully. Please log in again.',
    };
  }

  @Patch('password')
  async updatePassword(
    @Req() req: any,
    @Body() dto: UpdatePasswordDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    const username = req.user.username;
    await this.profileService.updatePassword(username, dto, req.user.id);

    this.clearSessionCookie(req, response);

    return {
      success: true,
      message: 'Password updated successfully. Please log in again.',
    };
  }

  private clearSessionCookie(request: Request, response: Response) {
    response.clearCookie('admin_session', getCookieOptions(this.configService));
  }
}

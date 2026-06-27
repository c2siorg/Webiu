import {
  Controller,
  Post,
  Get,
  Body,
  Req,
  Res,
  HttpCode,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { Admin } from '../database/entities/admin.entity';
import { AuditLogService } from '../audit-log/audit-log.service';
import { UseGuards } from '@nestjs/common';
import { AdminGuard } from './guards/admin.guard';
import { getCookieOptions } from '../common/utils/cookie-helper';
import { Throttle } from '@nestjs/throttler';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    @InjectRepository(Admin)
    private readonly adminRepository: Repository<Admin>,
    private readonly auditLogService: AuditLogService,
  ) {}

  @Throttle({ default: { ttl: 60_000, limit: 5 } })
  @Post('login')
  @HttpCode(200)
  async login(
    @Req() request: Request,
    @Body() loginDto: LoginDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    const token = await this.authService.login(loginDto);

    response.cookie('admin_session', token, {
      ...getCookieOptions(this.configService),
      maxAge: 3600 * 1000, // 1 hour
    });

    // Audit log LOGIN
    const admin = await this.adminRepository.findOne({
      where: { username: loginDto.username },
    });
    if (admin) {
      await this.auditLogService.createLog({
        adminId: admin.id,
        action: 'LOGIN',
        entityType: 'profile',
        entityId: admin.id,
        metadata: {
          ip: request.ip || request.headers?.['x-forwarded-for'] || '',
          userAgent: request.headers?.['user-agent'] || '',
        },
      });
    }

    return { success: true };
  }

  @Post('logout')
  @UseGuards(AdminGuard)
  @HttpCode(200)
  async logout(
    @Req() request: any,
    @Res({ passthrough: true }) response: Response,
  ) {
    // Invalidate token by incrementing version in database
    if (request.user && request.user.id) {
      const admin = await this.adminRepository.findOne({
        where: { id: request.user.id },
      });
      if (admin) {
        admin.tokenVersion = (admin.tokenVersion || 1) + 1;
        await this.adminRepository.save(admin);
      }

      // Audit log LOGOUT
      await this.auditLogService.createLog({
        adminId: request.user.id,
        action: 'LOGOUT',
        entityType: 'profile',
        entityId: request.user.id,
        metadata: {
          ip: request.ip || request.headers?.['x-forwarded-for'] || '',
          userAgent: request.headers?.['user-agent'] || '',
        },
      });
    }

    response.clearCookie('admin_session', getCookieOptions(this.configService));

    return { success: true };
  }

  @Get('me')
  async checkSession(@Req() request: Request) {
    const cookieHeader = request.headers.cookie;
    const token = this.extractCookie(cookieHeader, 'admin_session');

    if (!token) {
      return { authenticated: false };
    }

    try {
      const decoded = this.jwtService.verify(token);
      const adminExists = await this.adminRepository.findOne({
        where: { username: decoded.username },
      });

      if (
        adminExists &&
        decoded.role === 'admin' &&
        decoded.tokenVersion === adminExists.tokenVersion
      ) {
        return { authenticated: true };
      }
    } catch {}

    return { authenticated: false };
  }

  private extractCookie(
    cookieHeader: string | undefined,
    name: string,
  ): string | null {
    if (!cookieHeader) return null;
    const cookies = cookieHeader.split(';').map((c) => c.trim());
    for (const cookie of cookies) {
      const [key, ...valueParts] = cookie.split('=');
      if (key === name) {
        return valueParts.join('=');
      }
    }
    return null;
  }
}

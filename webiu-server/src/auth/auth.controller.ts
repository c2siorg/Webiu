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

  @Post('login')
  @HttpCode(200)
  async login(
    @Req() request: Request,
    @Body() loginDto: LoginDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    const token = await this.authService.login(loginDto);
    const host = request.get('host') || '';
    const isLocalhost =
      host.includes('localhost') || host.includes('127.0.0.1');

    response.cookie('admin_session', token, {
      httpOnly: true,
      secure: isLocalhost
        ? false
        : this.configService.get<string>('NODE_ENV') === 'production',
      sameSite: 'lax',
      path: '/',
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
    const host = request.get('host') || '';
    const isLocalhost =
      host.includes('localhost') || host.includes('127.0.0.1');

    // Audit log LOGOUT
    if (request.user && request.user.id) {
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

    response.clearCookie('admin_session', {
      httpOnly: true,
      secure: isLocalhost
        ? false
        : this.configService.get<string>('NODE_ENV') === 'production',
      sameSite: 'lax',
      path: '/',
    });

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

      if (adminExists) {
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

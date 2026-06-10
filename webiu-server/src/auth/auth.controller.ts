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
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
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

    return { success: true };
  }

  @Post('logout')
  @HttpCode(200)
  async logout(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    const host = request.get('host') || '';
    const isLocalhost =
      host.includes('localhost') || host.includes('127.0.0.1');

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
      const adminUser = this.configService.get<string>('ADMIN_USERNAME');

      if (adminUser && decoded.username === adminUser) {
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

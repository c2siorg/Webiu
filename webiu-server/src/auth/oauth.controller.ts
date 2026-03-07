import {
  Controller,
  Get,
  Post,
  Logger,
  Query,
  Req,
  Res,
  BadRequestException,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request, Response } from 'express';
import axios from 'axios';
import { OAuth2Client } from 'google-auth-library';
import { GithubService } from '../github/github.service';
import { JwtService } from '@nestjs/jwt';

const AUTH_COOKIE_NAME = 'webiu_auth';

interface SessionUser {
  id: string;
  login: string;
  name: string;
  email?: string;
  avatar_url?: string;
  provider: 'google' | 'github';
}

@Controller('auth')
export class OAuthController {
  private readonly logger = new Logger(OAuthController.name);
  private googleClient: OAuth2Client;

  constructor(
    private configService: ConfigService,
    private githubService: GithubService,
    private jwtService: JwtService,
  ) {
    this.googleClient = new OAuth2Client(
      this.configService.get<string>('GOOGLE_CLIENT_ID'),
      this.configService.get<string>('GOOGLE_CLIENT_SECRET'),
    );
  }

  private isProduction() {
    return this.configService.get<string>('NODE_ENV') === 'production';
  }

  private setAuthCookie(res: Response, token: string) {
    res.cookie(AUTH_COOKIE_NAME, token, {
      httpOnly: true,
      secure: this.isProduction(),
      sameSite: 'lax',
      maxAge: 60 * 60 * 1000,
      path: '/',
    });
  }

  private clearAuthCookie(res: Response) {
    res.clearCookie(AUTH_COOKIE_NAME, {
      httpOnly: true,
      secure: this.isProduction(),
      sameSite: 'lax',
      path: '/',
    });
  }

  private extractAuthToken(req: Request): string | null {
    const cookieHeader = req.headers.cookie;
    if (!cookieHeader) return null;

    const cookies = cookieHeader.split(';');
    for (const cookie of cookies) {
      const [key, ...valueParts] = cookie.trim().split('=');
      if (key === AUTH_COOKIE_NAME) {
        return decodeURIComponent(valueParts.join('='));
      }
    }

    return null;
  }

  // ─── Google OAuth ───

  @Get('google')
  googleAuth(@Res() res: Response) {
    const clientId = this.configService.get<string>('GOOGLE_CLIENT_ID');
    const redirectUri = this.configService.get<string>('GOOGLE_REDIRECT_URI');
    const googleAuthURL = `https://accounts.google.com/o/oauth2/v2/auth?response_type=code&client_id=${clientId}&redirect_uri=${redirectUri}&scope=email%20profile`;
    res.redirect(googleAuthURL);
  }

  @Get('google/callback')
  async googleCallback(@Query('code') code: string, @Res() res: Response) {
    if (!code) {
      throw new BadRequestException('Authorization code missing');
    }

    try {
      const tokenResponse = await axios.post(
        'https://oauth2.googleapis.com/token',
        {
          code,
          client_id: this.configService.get<string>('GOOGLE_CLIENT_ID'),
          client_secret: this.configService.get<string>('GOOGLE_CLIENT_SECRET'),
          redirect_uri: this.configService.get<string>('GOOGLE_REDIRECT_URI'),
          grant_type: 'authorization_code',
        },
      );

      if (tokenResponse.data.error) {
        throw new BadRequestException(tokenResponse.data.error_description);
      }

      const accessToken = tokenResponse.data.access_token;
      const idToken = tokenResponse.data.id_token;

      // Get user info
      const userResponse = await axios.get(
        `https://www.googleapis.com/oauth2/v2/userinfo?access_token=${accessToken}`,
      );

      // Verify ID token
      await this.googleClient.verifyIdToken({
        idToken,
        audience: this.configService.get<string>('GOOGLE_CLIENT_ID'),
      });

      const user = userResponse.data as Record<string, any>;
      const sessionUser: SessionUser = {
        id: String(user.id ?? ''),
        login: String(user.email ?? user.id ?? 'google-user'),
        name: String(user.name ?? user.email ?? 'User'),
        email: user.email,
        avatar_url: user.picture,
        provider: 'google',
      };

      const token = await this.jwtService.signAsync({ user: sessionUser });
      this.setAuthCookie(res, token);

      const frontendUrl = this.configService.get<string>(
        'FRONTEND_BASE_URL',
        'http://localhost:4200',
      );
      res.redirect(frontendUrl);
    } catch (error) {
      this.logger.error('Error during Google OAuth:', error);
      throw new InternalServerErrorException({
        message: 'Error authenticating with Google',
        error: error.response?.data || error.message,
      });
    }
  }

  // ─── GitHub OAuth ───

  @Get('github')
  githubAuth(@Res() res: Response) {
    const clientId = this.configService.get<string>('GITHUB_CLIENT_ID');
    const redirectUri = this.configService.get<string>('GITHUB_REDIRECT_URI');
    const githubAuthURL = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&scope=user`;
    res.redirect(githubAuthURL);
  }

  @Get('github/callback')
  async githubCallback(@Query('code') code: string, @Res() res: Response) {
    if (!code) {
      throw new BadRequestException('Authorization code missing');
    }

    try {
      const tokenData = await this.githubService.exchangeGithubCode(
        this.configService.get<string>('GITHUB_CLIENT_ID'),
        this.configService.get<string>('GITHUB_CLIENT_SECRET'),
        code,
        this.configService.get<string>('GITHUB_REDIRECT_URI'),
      );

      if (tokenData.error) {
        throw new BadRequestException(tokenData.error_description);
      }

      const user = (await this.githubService.getUserInfo(
        tokenData.access_token,
      )) as Record<string, any>;
      const sessionUser: SessionUser = {
        id: String(user.id ?? ''),
        login: String(user.login ?? user.id ?? 'github-user'),
        name: String(user.name ?? user.login ?? 'User'),
        email: user.email ?? undefined,
        avatar_url: user.avatar_url ?? undefined,
        provider: 'github',
      };

      const token = await this.jwtService.signAsync({ user: sessionUser });
      this.setAuthCookie(res, token);

      const frontendUrl = this.configService.get<string>(
        'FRONTEND_BASE_URL',
        'http://localhost:4200',
      );
      res.redirect(frontendUrl);
    } catch (error) {
      this.logger.error('Error during GitHub OAuth:', error);
      throw new InternalServerErrorException({
        message: 'Error authenticating with GitHub',
        error: error.response?.data || error.message,
      });
    }
  }

  @Get('me')
  async me(@Req() req: Request) {
    const token = this.extractAuthToken(req);
    if (!token) {
      throw new UnauthorizedException('Not authenticated');
    }

    try {
      const payload = await this.jwtService.verifyAsync<{ user: SessionUser }>(
        token,
      );
      return payload.user;
    } catch {
      throw new UnauthorizedException('Invalid or expired session');
    }
  }

  @Post('logout')
  logout(@Res({ passthrough: true }) res: Response) {
    this.clearAuthCookie(res);
    return { message: 'Logged out successfully' };
  }
}

import {
  Controller,
  Get,
  Query,
  Res,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Response } from 'express';
import axios from 'axios';
import { OAuth2Client } from 'google-auth-library';
import { randomBytes } from 'crypto';
import { GithubService } from '../github/github.service';

@Controller('auth')
export class OAuthController {
  private googleClient: OAuth2Client;
  private stateTokens = new Map<string, number>();

  constructor(
    private configService: ConfigService,
    private githubService: GithubService,
  ) {
    this.googleClient = new OAuth2Client(
      this.configService.get<string>('GOOGLE_CLIENT_ID'),
      this.configService.get<string>('GOOGLE_CLIENT_SECRET'),
    );

    // Cleanup expired tokens every 10 minutes
    setInterval(() => this.cleanupExpiredTokens(), 600000);
  }

  private cleanupExpiredTokens() {
    const now = Date.now();
    const expiryTime = 600000; // 10 minutes
    for (const [state, timestamp] of this.stateTokens.entries()) {
      if (now - timestamp > expiryTime) {
        this.stateTokens.delete(state);
      }
    }
  }

  private validateState(state: string): void {
    if (!state) {
      throw new BadRequestException('State parameter missing');
    }

    if (!this.stateTokens.has(state)) {
      throw new BadRequestException(
        'Invalid state parameter - possible CSRF attack',
      );
    }

    const timestamp = this.stateTokens.get(state);
    const expiryTime = 600000; // 10 minutes

    if (Date.now() - timestamp > expiryTime) {
      this.stateTokens.delete(state);
      throw new BadRequestException('State token expired');
    }

    // Delete used token
    this.stateTokens.delete(state);
  }

  // ─── Google OAuth ───

  @Get('google')
  googleAuth(@Res() res: Response) {
    const state = randomBytes(32).toString('hex');
    this.stateTokens.set(state, Date.now());

    const clientId = this.configService.get<string>('GOOGLE_CLIENT_ID');
    const redirectUri = this.configService.get<string>('GOOGLE_REDIRECT_URI');
    const googleAuthURL = `https://accounts.google.com/o/oauth2/v2/auth?response_type=code&client_id=${clientId}&redirect_uri=${redirectUri}&scope=email%20profile&state=${state}`;
    res.redirect(googleAuthURL);
  }

  @Get('google/callback')
  async googleCallback(
    @Query('code') code: string,
    @Query('state') state: string,
    @Res() res: Response,
  ) {
    if (!code) {
      throw new BadRequestException('Authorization code missing');
    }

    // Validate state parameter for CSRF protection
    this.validateState(state);

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

      const user = userResponse.data;
      const frontendUrl = this.configService.get<string>(
        'FRONTEND_BASE_URL',
        'http://localhost:4200',
      );
      const redirectUrl = `${frontendUrl}?user=${encodeURIComponent(JSON.stringify(user))}`;
      res.redirect(redirectUrl);
    } catch (error) {
      console.error('Error during Google OAuth:', error);
      throw new InternalServerErrorException({
        message: 'Error authenticating with Google',
        error: error.response?.data || error.message,
      });
    }
  }

  // ─── GitHub OAuth ───

  @Get('github')
  githubAuth(@Res() res: Response) {
    const state = randomBytes(32).toString('hex');
    this.stateTokens.set(state, Date.now());

    const clientId = this.configService.get<string>('GITHUB_CLIENT_ID');
    const redirectUri = this.configService.get<string>('GITHUB_REDIRECT_URI');
    const githubAuthURL = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&scope=user&state=${state}`;
    res.redirect(githubAuthURL);
  }

  @Get('github/callback')
  async githubCallback(
    @Query('code') code: string,
    @Query('state') state: string,
    @Res() res: Response,
  ) {
    if (!code) {
      throw new BadRequestException('Authorization code missing');
    }

    // Validate state parameter for CSRF protection
    this.validateState(state);

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

      const user = await this.githubService.getUserInfo(tokenData.access_token);

      const frontendUrl = this.configService.get<string>(
        'FRONTEND_BASE_URL',
        'http://localhost:4200',
      );
      const redirectUrl = `${frontendUrl}?user=${encodeURIComponent(JSON.stringify(user))}`;
      res.redirect(redirectUrl);
    } catch (error) {
      console.error('Error during GitHub OAuth:', error);
      throw new InternalServerErrorException({
        message: 'Error authenticating with GitHub',
        error: error.response?.data || error.message,
      });
    }
  }
}

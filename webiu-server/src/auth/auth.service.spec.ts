import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { EmailService } from '../email/email.service';

describe('AuthService', () => {
  let service: AuthService;

  const configValues: Record<string, string> = {
    FRONTEND_BASE_URL: 'http://localhost:4200',
    AUTH_REQUIRE_EMAIL_VERIFICATION: 'false',
    ADMIN_NAME: 'Admin',
    ADMIN_EMAIL: 'admin@webiu.local',
    ADMIN_PASSWORD: 'admin123',
    NODE_ENV: 'test',
  };

  const mockJwtService = {
    sign: jest.fn().mockReturnValue('mock-token'),
  };

  const mockEmailService = {
    sendVerificationEmail: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn((key: string, fallback?: string) => configValues[key] ?? fallback),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: JwtService, useValue: mockJwtService },
        { provide: EmailService, useValue: mockEmailService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    jest.clearAllMocks();
  });

  it('should seed an admin user that can login', async () => {
    const result = await service.login({
      email: 'admin@webiu.local',
      password: 'admin123',
    });

    expect(result.user.role).toBe('admin');
    expect(result.accessToken).toBe('mock-token');
  });

  it('should register and login a normal user', async () => {
    await service.register({
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123',
      confirmPassword: 'password123',
    });

    const result = await service.login({
      email: 'test@example.com',
      password: 'password123',
    });

    expect(result.user.email).toBe('test@example.com');
    expect(result.user.role).toBe('user');
  });

  it('should reject register when passwords mismatch', async () => {
    await expect(
      service.register({
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
        confirmPassword: 'different123',
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('should reject duplicate registration', async () => {
    await service.register({
      name: 'Test User',
      email: 'duplicate@example.com',
      password: 'password123',
      confirmPassword: 'password123',
    });

    await expect(
      service.register({
        name: 'Test User',
        email: 'duplicate@example.com',
        password: 'password123',
        confirmPassword: 'password123',
      }),
    ).rejects.toThrow(ConflictException);
  });

  it('should reject invalid credentials', async () => {
    await expect(
      service.login({
        email: 'missing@example.com',
        password: 'password123',
      }),
    ).rejects.toThrow(UnauthorizedException);
  });
});

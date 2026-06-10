import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UnauthorizedException, ExecutionContext } from '@nestjs/common';
import { AdminGuard } from './admin.guard';

describe('AdminGuard', () => {
  let guard: AdminGuard;
  let jwtService: JwtService;

  const mockExecutionContext = (cookieValue?: string): ExecutionContext => {
    const request = {
      headers: {
        cookie: cookieValue ? `admin_session=${cookieValue}` : undefined,
      },
    } as any;
    return {
      switchToHttp: () => ({
        getRequest: () => request,
      }),
    } as ExecutionContext;
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminGuard,
        {
          provide: JwtService,
          useValue: {
            verify: jest.fn().mockReturnValue({ username: 'admin' }),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              if (key === 'ADMIN_USERNAME') return 'admin';
              return null;
            }),
          },
        },
      ],
    }).compile();

    guard = module.get<AdminGuard>(AdminGuard);
    jwtService = module.get<JwtService>(JwtService);
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  describe('canActivate', () => {
    it('should return true if token is valid and matches admin username', async () => {
      const context = mockExecutionContext('valid-jwt-token');

      const result = await guard.canActivate(context);

      expect(result).toBe(true);
      expect(jwtService.verify).toHaveBeenCalledWith('valid-jwt-token');
    });

    it('should throw UnauthorizedException if cookie is missing', async () => {
      const context = mockExecutionContext(undefined);

      await expect(guard.canActivate(context)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException if jwt validation fails', async () => {
      const context = mockExecutionContext('invalid-jwt');
      (jwtService.verify as jest.Mock).mockImplementation(() => {
        throw new Error('Invalid JWT');
      });

      await expect(guard.canActivate(context)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException if username in JWT does not match ADMIN_USERNAME', async () => {
      const context = mockExecutionContext('valid-jwt-token');
      (jwtService.verify as jest.Mock).mockReturnValue({
        username: 'not-admin',
      });

      await expect(guard.canActivate(context)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });
});

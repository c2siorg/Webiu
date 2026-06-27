import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ServiceUnavailableException, ExecutionContext } from '@nestjs/common';
import { MaintenanceGuard } from './maintenance.guard';
import { Admin } from '../../database/entities/admin.entity';
import { SystemSettingService } from '../../system-setting/system-setting.service';

describe('MaintenanceGuard', () => {
  let guard: MaintenanceGuard;
  let systemSettingService: SystemSettingService;
  let jwtService: JwtService;
  let adminRepositoryMock: any;

  const mockExecutionContext = (
    path: string,
    cookieValue?: string,
    type: 'http' | 'graphql' = 'http',
  ): ExecutionContext => {
    const request = {
      path,
      url: path,
      headers: {
        cookie: cookieValue ? `admin_session=${cookieValue}` : undefined,
      },
    } as any;

    if (type === 'http') {
      return {
        getType: () => 'http',
        switchToHttp: () => ({
          getRequest: () => request,
        }),
      } as any;
    } else {
      return {
        getType: () => 'graphql',
        getHandler: () => ({}),
        getClass: () => ({}),
        getArgs: () => [{}, {}, { req: request }, {}],
      } as any;
    }
  };

  beforeEach(async () => {
    adminRepositoryMock = {
      findOne: jest.fn().mockImplementation(({ where }) => {
        if (where.username === 'admin') {
          return { username: 'admin', tokenVersion: 1 } as Admin;
        }
        return null;
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MaintenanceGuard,
        {
          provide: SystemSettingService,
          useValue: {
            getSettingBool: jest.fn().mockResolvedValue(false),
          },
        },
        {
          provide: JwtService,
          useValue: {
            verify: jest.fn().mockReturnValue({
              username: 'admin',
              role: 'admin',
              tokenVersion: 1,
            }),
          },
        },
        {
          provide: getRepositoryToken(Admin),
          useValue: adminRepositoryMock,
        },
      ],
    }).compile();

    guard = module.get<MaintenanceGuard>(MaintenanceGuard);
    systemSettingService =
      module.get<SystemSettingService>(SystemSettingService);
    jwtService = module.get<JwtService>(JwtService);
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  describe('canActivate', () => {
    it('should return true if maintenance mode is disabled', async () => {
      jest
        .spyOn(systemSettingService, 'getSettingBool')
        .mockResolvedValue(false);
      const context = mockExecutionContext('/api/v1/projects');

      const result = await guard.canActivate(context);
      expect(result).toBe(true);
    });

    describe('when maintenance mode is enabled', () => {
      beforeEach(() => {
        jest
          .spyOn(systemSettingService, 'getSettingBool')
          .mockResolvedValue(true);
      });

      it('should allow /health check', async () => {
        const context = mockExecutionContext('/health');
        const result = await guard.canActivate(context);
        expect(result).toBe(true);
      });

      it('should allow /ready check', async () => {
        const context = mockExecutionContext('/ready');
        const result = await guard.canActivate(context);
        expect(result).toBe(true);
      });

      it('should allow admin routes starting with /admin', async () => {
        const context = mockExecutionContext('/admin/settings');
        const result = await guard.canActivate(context);
        expect(result).toBe(true);
      });

      it('should allow auth routes starting with /auth', async () => {
        const context = mockExecutionContext('/auth/login');
        const result = await guard.canActivate(context);
        expect(result).toBe(true);
      });

      it('should block public routes for unauthenticated users', async () => {
        const context = mockExecutionContext('/api/v1/projects');
        await expect(guard.canActivate(context)).rejects.toThrow(
          ServiceUnavailableException,
        );
      });

      it('should allow public routes for authenticated admins', async () => {
        const context = mockExecutionContext('/api/v1/projects', 'valid-jwt');
        const result = await guard.canActivate(context);
        expect(result).toBe(true);
        expect(jwtService.verify).toHaveBeenCalledWith('valid-jwt');
      });

      it('should block public routes if admin cookie verification fails', async () => {
        const context = mockExecutionContext('/api/v1/projects', 'invalid-jwt');
        jest.spyOn(jwtService, 'verify').mockImplementation(() => {
          throw new Error('invalid token');
        });

        await expect(guard.canActivate(context)).rejects.toThrow(
          ServiceUnavailableException,
        );
      });

      it('should work for GraphQL context (block when no admin)', async () => {
        const context = mockExecutionContext('/graphql', undefined, 'graphql');
        await expect(guard.canActivate(context)).rejects.toThrow(
          ServiceUnavailableException,
        );
      });

      it('should work for GraphQL context (allow when admin present)', async () => {
        const context = mockExecutionContext(
          '/graphql',
          'valid-jwt',
          'graphql',
        );
        const result = await guard.canActivate(context);
        expect(result).toBe(true);
      });
    });
  });
});

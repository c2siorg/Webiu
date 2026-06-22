import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { AdminProfileController } from './admin-profile.controller';
import { AdminProfileService } from './admin-profile.service';
import { AdminGuard } from '../auth/guards/admin.guard';
import { Response } from 'express';

describe('AdminProfileController', () => {
  let controller: AdminProfileController;
  let service: AdminProfileService;

  const mockProfileService = {
    getProfile: jest.fn(),
    updateUsername: jest.fn(),
    updatePassword: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn().mockReturnValue('development'),
  };

  const mockAdminGuard = {
    canActivate: jest.fn().mockReturnValue(true),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AdminProfileController],
      providers: [
        {
          provide: AdminProfileService,
          useValue: mockProfileService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    })
      .overrideGuard(AdminGuard)
      .useValue(mockAdminGuard)
      .compile();

    controller = module.get<AdminProfileController>(AdminProfileController);
    service = module.get<AdminProfileService>(AdminProfileService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getProfile', () => {
    it('should return profile information', async () => {
      const mockAdmin = {
        username: 'admin',
        createdAt: new Date('2026-01-01T00:00:00.000Z'),
        lastLoginAt: new Date('2026-01-02T00:00:00.000Z'),
      };
      mockProfileService.getProfile.mockResolvedValue(mockAdmin);

      const req = { user: { username: 'admin' } };
      const result = await controller.getProfile(req);

      expect(result).toEqual({
        username: 'admin',
        role: 'administrator',
        createdAt: mockAdmin.createdAt,
        lastLoginAt: mockAdmin.lastLoginAt,
      });
      expect(service.getProfile).toHaveBeenCalledWith('admin');
    });
  });

  describe('updateUsername', () => {
    it('should update username and clear cookie', async () => {
      mockProfileService.updateUsername.mockResolvedValue({
        username: 'new-name',
      });

      const req = {
        user: { id: 'mock-admin-id', username: 'admin' },
        get: jest.fn().mockReturnValue('localhost'),
      };
      const res = {
        clearCookie: jest.fn(),
      } as unknown as Response;

      const result = await controller.updateUsername(
        req,
        { username: 'new-name' },
        res,
      );

      expect(result).toEqual({
        success: true,
        message: 'Username updated successfully. Please log in again.',
      });
      expect(service.updateUsername).toHaveBeenCalledWith(
        'admin',
        'new-name',
        'mock-admin-id',
      );
      expect(res.clearCookie).toHaveBeenCalledWith(
        'admin_session',
        expect.any(Object),
      );
    });
  });

  describe('updatePassword', () => {
    it('should update password and clear cookie', async () => {
      mockProfileService.updatePassword.mockResolvedValue(undefined);

      const req = {
        user: { id: 'mock-admin-id', username: 'admin' },
        get: jest.fn().mockReturnValue('localhost'),
      };
      const res = {
        clearCookie: jest.fn(),
      } as unknown as Response;

      const dto = {
        currentPassword: 'old',
        newPassword: 'new-password',
        confirmPassword: 'new-password',
      };

      const result = await controller.updatePassword(req, dto, res);

      expect(result).toEqual({
        success: true,
        message: 'Password updated successfully. Please log in again.',
      });
      expect(service.updatePassword).toHaveBeenCalledWith(
        'admin',
        dto,
        'mock-admin-id',
      );
      expect(res.clearCookie).toHaveBeenCalledWith(
        'admin_session',
        expect.any(Object),
      );
    });
  });
});

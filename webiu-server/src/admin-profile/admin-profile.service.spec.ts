import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { AdminProfileService } from './admin-profile.service';
import { Admin } from '../database/entities/admin.entity';

describe('AdminProfileService', () => {
  let service: AdminProfileService;
  let adminRepositoryMock: any;

  beforeEach(async () => {
    adminRepositoryMock = {
      findOne: jest.fn(),
      save: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminProfileService,
        {
          provide: getRepositoryToken(Admin),
          useValue: adminRepositoryMock,
        },
      ],
    }).compile();

    service = module.get<AdminProfileService>(AdminProfileService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getProfile', () => {
    it('should return admin profile if found', async () => {
      const mockAdmin = { username: 'admin', id: '123' } as Admin;
      adminRepositoryMock.findOne.mockResolvedValue(mockAdmin);

      const result = await service.getProfile('admin');

      expect(result).toBe(mockAdmin);
      expect(adminRepositoryMock.findOne).toHaveBeenCalledWith({
        where: { username: 'admin' },
      });
    });

    it('should throw NotFoundException if admin not found', async () => {
      adminRepositoryMock.findOne.mockResolvedValue(null);

      await expect(service.getProfile('non-existent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('updateUsername', () => {
    it('should throw BadRequestException if new username is already taken', async () => {
      adminRepositoryMock.findOne.mockResolvedValue({
        username: 'existing',
      } as Admin);

      await expect(service.updateUsername('admin', 'existing')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should successfully update and save username if unique', async () => {
      const mockAdmin = { username: 'admin', id: '123' } as Admin;
      adminRepositoryMock.findOne
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(mockAdmin);
      adminRepositoryMock.save.mockResolvedValue({
        ...mockAdmin,
        username: 'new-name',
      });

      await service.updateUsername('admin', 'new-name');

      expect(mockAdmin.username).toBe('new-name');
      expect(adminRepositoryMock.save).toHaveBeenCalledWith(mockAdmin);
    });
  });

  describe('updatePassword', () => {
    it('should throw BadRequestException if passwords do not match', async () => {
      const dto = {
        currentPassword: 'old',
        newPassword: 'new1',
        confirmPassword: 'new2',
      };

      await expect(service.updatePassword('admin', dto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException if current password verification fails', async () => {
      const dto = {
        currentPassword: 'wrong-old',
        newPassword: 'new-password',
        confirmPassword: 'new-password',
      };
      const mockAdmin = {
        username: 'admin',
        passwordHash: 'hashed-old',
      } as Admin;
      adminRepositoryMock.findOne.mockResolvedValue(mockAdmin);

      jest
        .spyOn(bcrypt, 'compare')
        .mockImplementation(() => Promise.resolve(false));

      await expect(service.updatePassword('admin', dto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException if new password is same as old', async () => {
      const dto = {
        currentPassword: 'old-password',
        newPassword: 'old-password',
        confirmPassword: 'old-password',
      };
      const mockAdmin = {
        username: 'admin',
        passwordHash: 'hashed-old',
      } as Admin;
      adminRepositoryMock.findOne.mockResolvedValue(mockAdmin);

      jest
        .spyOn(bcrypt, 'compare')
        .mockImplementation(() => Promise.resolve(true));

      await expect(service.updatePassword('admin', dto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should update password hash and save successfully if inputs are valid', async () => {
      const dto = {
        currentPassword: 'old-password',
        newPassword: 'new-password',
        confirmPassword: 'new-password',
      };
      const mockAdmin = {
        username: 'admin',
        passwordHash: 'hashed-old',
      } as Admin;
      adminRepositoryMock.findOne.mockResolvedValue(mockAdmin);

      jest
        .spyOn(bcrypt, 'compare')
        .mockResolvedValueOnce(true as never)
        .mockResolvedValueOnce(false as never);

      jest
        .spyOn(bcrypt, 'hash')
        .mockImplementation(() => Promise.resolve('hashed-new'));

      await service.updatePassword('admin', dto);

      expect(mockAdmin.passwordHash).toBe('hashed-new');
      expect(adminRepositoryMock.save).toHaveBeenCalledWith(mockAdmin);
    });
  });
});

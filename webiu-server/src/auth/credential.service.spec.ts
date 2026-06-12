import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import * as bcrypt from 'bcryptjs';
import { CredentialService } from './credential.service';
import { Admin } from '../database/entities/admin.entity';

describe('CredentialService', () => {
  let service: CredentialService;
  let adminRepositoryMock: any;

  beforeEach(async () => {
    adminRepositoryMock = {
      findOne: jest.fn(),
      save: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CredentialService,
        {
          provide: getRepositoryToken(Admin),
          useValue: adminRepositoryMock,
        },
      ],
    }).compile();

    service = module.get<CredentialService>(CredentialService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('validateCredentials', () => {
    it('should return false if admin is not found', async () => {
      adminRepositoryMock.findOne.mockResolvedValue(null);

      const result = await service.validateCredentials('wrong-admin', 'pass');

      expect(result).toBe(false);
      expect(adminRepositoryMock.findOne).toHaveBeenCalledWith({
        where: { username: 'wrong-admin' },
      });
    });

    it('should return false if password comparison fails', async () => {
      const mockAdmin = {
        username: 'admin',
        passwordHash: 'hashed-password',
      } as Admin;
      adminRepositoryMock.findOne.mockResolvedValue(mockAdmin);
      jest
        .spyOn(bcrypt, 'compare')
        .mockImplementation(() => Promise.resolve(false));

      const result = await service.validateCredentials('admin', 'wrong-pass');

      expect(result).toBe(false);
      expect(bcrypt.compare).toHaveBeenCalledWith(
        'wrong-pass',
        'hashed-password',
      );
    });

    it('should return true and update lastLoginAt if credentials are valid', async () => {
      const mockAdmin = {
        username: 'admin',
        passwordHash: 'hashed-password',
        lastLoginAt: null,
      } as Admin;
      adminRepositoryMock.findOne.mockResolvedValue(mockAdmin);
      jest
        .spyOn(bcrypt, 'compare')
        .mockImplementation(() => Promise.resolve(true));

      const result = await service.validateCredentials('admin', 'correct-pass');

      expect(result).toBe(true);
      expect(mockAdmin.lastLoginAt).toBeInstanceOf(Date);
      expect(adminRepositoryMock.save).toHaveBeenCalledWith(mockAdmin);
    });
  });
});

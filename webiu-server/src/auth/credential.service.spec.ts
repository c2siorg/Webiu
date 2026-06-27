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
      update: jest.fn(),
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

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('validateCredentials', () => {
    it('should return false if admin is not found and run dummy bcrypt comparison', async () => {
      adminRepositoryMock.findOne.mockResolvedValue(null);
      const compareSpy = jest
        .spyOn(bcrypt, 'compare')
        .mockImplementation(() => Promise.resolve(false));

      const result = await service.validateCredentials('wrong-admin', 'pass');

      expect(result).toBe(false);
      expect(adminRepositoryMock.findOne).toHaveBeenCalledWith({
        where: { username: 'wrong-admin' },
      });
      expect(compareSpy).toHaveBeenCalledWith(
        'pass',
        '$2b$10$s7v7P6yP0d7HUX7p5xP6uO5i2Zf9c0Z2O5eW8p3k8p5p5p5p5p5p5',
      );
    });

    it('should return false if password comparison fails', async () => {
      const mockAdmin = {
        username: 'admin',
        passwordHash: 'hashed-password',
      } as Admin;
      adminRepositoryMock.findOne.mockResolvedValue(mockAdmin);
      const compareSpy = jest
        .spyOn(bcrypt, 'compare')
        .mockImplementation(() => Promise.resolve(false));

      const result = await service.validateCredentials('admin', 'wrong-pass');

      expect(result).toBe(false);
      expect(compareSpy).toHaveBeenCalledWith('wrong-pass', 'hashed-password');
    });

    it('should return true and update lastLoginAt if credentials are valid', async () => {
      const mockAdmin = {
        id: 'some-uuid',
        username: 'admin',
        passwordHash: 'hashed-password',
        lastLoginAt: null,
      } as Admin;
      adminRepositoryMock.findOne.mockResolvedValue(mockAdmin);
      const compareSpy = jest
        .spyOn(bcrypt, 'compare')
        .mockImplementation(() => Promise.resolve(true));

      const result = await service.validateCredentials('admin', 'correct-pass');

      expect(result).toBe(true);
      expect(mockAdmin.lastLoginAt).toBeInstanceOf(Date);
      expect(adminRepositoryMock.update).toHaveBeenCalledWith('some-uuid', {
        lastLoginAt: expect.any(Date),
      });
      expect(compareSpy).toHaveBeenCalledWith(
        'correct-pass',
        'hashed-password',
      );
    });
  });
});

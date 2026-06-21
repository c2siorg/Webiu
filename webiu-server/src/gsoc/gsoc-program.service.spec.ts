import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GsocProgramService } from './gsoc-program.service';
import { GsocProgram } from '../database/entities/gsoc-program.entity';
import { SystemSettingService } from '../system-setting/system-setting.service';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { AuditLogService } from '../audit-log/audit-log.service';

describe('GsocProgramService', () => {
  let service: GsocProgramService;
  let programRepository: jest.Mocked<Repository<GsocProgram>>;
  let systemSettingService: jest.Mocked<SystemSettingService>;

  const mockProgramRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  const mockSystemSettingService = {
    getSettingNumber: jest.fn(),
  };

  const mockAuditLogService = {
    createLog: jest.fn().mockResolvedValue({}),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GsocProgramService,
        {
          provide: getRepositoryToken(GsocProgram),
          useValue: mockProgramRepository,
        },
        {
          provide: SystemSettingService,
          useValue: mockSystemSettingService,
        },
        {
          provide: AuditLogService,
          useValue: mockAuditLogService,
        },
      ],
    }).compile();

    service = module.get<GsocProgramService>(GsocProgramService);
    programRepository = module.get(getRepositoryToken(GsocProgram));
    systemSettingService = module.get(SystemSettingService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should throw BadRequestException if program for the year already exists', async () => {
      programRepository.findOne.mockResolvedValueOnce({
        id: '1',
        year: 2026,
      } as any);
      await expect(
        service.create({ year: 2026, title: 'Title' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should create and save a program', async () => {
      programRepository.findOne.mockResolvedValueOnce(null);
      programRepository.create.mockReturnValueOnce({
        year: 2026,
        title: 'Title',
      } as any);
      programRepository.save.mockResolvedValueOnce({
        id: '1',
        year: 2026,
        title: 'Title',
      } as any);

      const result = await service.create({ year: 2026, title: 'Title' });
      expect(result.year).toBe(2026);
      expect(programRepository.save).toHaveBeenCalled();
    });
  });

  describe('findCurrentPublicProgram', () => {
    it('should throw NotFoundException if no published program matches system setting year', async () => {
      systemSettingService.getSettingNumber.mockResolvedValueOnce(2026);
      programRepository.findOne.mockResolvedValueOnce(null);

      await expect(service.findCurrentPublicProgram()).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should return the program if found', async () => {
      systemSettingService.getSettingNumber.mockResolvedValueOnce(2026);
      const mockProgram = { id: '1', year: 2026, status: 'PUBLISHED' };
      programRepository.findOne.mockResolvedValueOnce(mockProgram as any);

      const result = await service.findCurrentPublicProgram();
      expect(result).toEqual(mockProgram);
    });
  });
});

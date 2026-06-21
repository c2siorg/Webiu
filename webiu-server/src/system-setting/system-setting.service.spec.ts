import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { SystemSetting } from '../database/entities/system-setting.entity';
import { SystemSettingService } from './system-setting.service';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { AuditLogService } from '../audit-log/audit-log.service';

describe('SystemSettingService', () => {
  let service: SystemSettingService;

  const mockRepository = {
    findOne: jest.fn(),
    find: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };

  const mockAuditLogService = {
    createLog: jest.fn().mockResolvedValue({}),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SystemSettingService,
        {
          provide: getRepositoryToken(SystemSetting),
          useValue: mockRepository,
        },
        {
          provide: AuditLogService,
          useValue: mockAuditLogService,
        },
      ],
    }).compile();

    service = module.get<SystemSettingService>(SystemSettingService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('onApplicationBootstrap', () => {
    it('should seed missing settings', async () => {
      mockRepository.findOne.mockResolvedValue(null);
      mockRepository.create.mockImplementation((dto) => dto);
      mockRepository.save.mockResolvedValue({});

      await service.onApplicationBootstrap();

      expect(mockRepository.create).toHaveBeenCalledTimes(6);
      expect(mockRepository.save).toHaveBeenCalledTimes(6);
    });

    it('should not seed if settings already exist', async () => {
      mockRepository.findOne.mockResolvedValue({
        id: '1',
        key: 'gsoc.current_year',
        value: '2026',
      });

      await service.onApplicationBootstrap();

      expect(mockRepository.create).not.toHaveBeenCalled();
      expect(mockRepository.save).not.toHaveBeenCalled();
    });
  });

  describe('getSetting', () => {
    it('should return value from DB if exists', async () => {
      mockRepository.findOne.mockResolvedValue({
        key: 'site.title',
        value: 'Custom WebiU',
      });

      const result = await service.getSetting('site.title');
      expect(result).toBe('Custom WebiU');
      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { key: 'site.title' },
      });
    });

    it('should fallback to default value if DB does not have the key', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      const result = await service.getSetting('site.title');
      expect(result).toBe('WebiU');
    });

    it('should throw NotFoundException for unknown keys', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.getSetting('unknown.key')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('getSettingBool', () => {
    it('should return true for "true" setting', async () => {
      mockRepository.findOne.mockResolvedValue({
        key: 'gsoc.registration_open',
        value: 'true',
      });
      const result = await service.getSettingBool('gsoc.registration_open');
      expect(result).toBe(true);
    });

    it('should return false for "false" setting', async () => {
      mockRepository.findOne.mockResolvedValue({
        key: 'gsoc.registration_open',
        value: 'false',
      });
      const result = await service.getSettingBool('gsoc.registration_open');
      expect(result).toBe(false);
    });
  });

  describe('getSettingNumber', () => {
    it('should return parsed number', async () => {
      mockRepository.findOne.mockResolvedValue({
        key: 'gsoc.current_year',
        value: '2026',
      });
      const result = await service.getSettingNumber('gsoc.current_year');
      expect(result).toBe(2026);
    });

    it('should throw BadRequestException if value is not a valid number', async () => {
      mockRepository.findOne.mockResolvedValue({
        key: 'gsoc.current_year',
        value: 'invalid_number',
      });
      await expect(
        service.getSettingNumber('gsoc.current_year'),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('getAllSettings', () => {
    it('should return all settings typed correctly', async () => {
      mockRepository.find.mockResolvedValue([
        { key: 'gsoc.current_year', value: '2027' },
        { key: 'gsoc.show_ideas_page', value: 'false' },
      ]);

      const result = await service.getAllSettings();
      expect(result['gsoc.current_year']).toBe(2027);
      expect(result['gsoc.show_ideas_page']).toBe(false);
      expect(result['site.title']).toBe('WebiU'); // Default fallback
    });
  });

  describe('updateSettings', () => {
    it('should update valid settings', async () => {
      mockRepository.findOne.mockResolvedValue({
        key: 'site.title',
        value: 'WebiU',
      });
      mockRepository.save.mockResolvedValue({});
      mockRepository.find
        .mockResolvedValueOnce([
          { key: 'site.title', value: 'WebiU' },
          { key: 'gsoc.current_year', value: '2026' },
        ])
        .mockResolvedValueOnce([
          { key: 'site.title', value: 'My New Title' },
          { key: 'gsoc.current_year', value: '2027' },
        ]);

      const updates = {
        'site.title': 'My New Title',
        'gsoc.current_year': 2027,
      };

      const result = await service.updateSettings(updates);
      expect(mockRepository.save).toHaveBeenCalledTimes(2);
      expect(result['site.title']).toBe('My New Title');
      expect(result['gsoc.current_year']).toBe(2027);
    });

    it('should throw BadRequestException on invalid setting keys', async () => {
      await expect(
        service.updateSettings({ 'invalid.key': 'some_val' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException on invalid values (current year out of range)', async () => {
      await expect(
        service.updateSettings({ 'gsoc.current_year': 1999 }),
      ).rejects.toThrow(BadRequestException);

      await expect(
        service.updateSettings({ 'gsoc.current_year': 'not-a-number' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException on invalid values (bool constraint)', async () => {
      await expect(
        service.updateSettings({ 'gsoc.show_ideas_page': 'yes' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException on empty site title', async () => {
      await expect(
        service.updateSettings({ 'site.title': '  ' }),
      ).rejects.toThrow(BadRequestException);
    });
  });
});

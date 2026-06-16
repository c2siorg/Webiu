import { Test, TestingModule } from '@nestjs/testing';
import { SystemSettingController } from './system-setting.controller';
import { SystemSettingService } from './system-setting.service';
import { AdminGuard } from '../auth/guards/admin.guard';

describe('SystemSettingController', () => {
  let controller: SystemSettingController;
  let service: SystemSettingService;

  const mockSystemSettingService = {
    getAllSettings: jest.fn(),
    updateSettings: jest.fn(),
  };

  const mockAdminGuard = {
    canActivate: jest.fn().mockReturnValue(true),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SystemSettingController],
      providers: [
        {
          provide: SystemSettingService,
          useValue: mockSystemSettingService,
        },
      ],
    })
      .overrideGuard(AdminGuard)
      .useValue(mockAdminGuard)
      .compile();

    controller = module.get<SystemSettingController>(SystemSettingController);
    service = module.get<SystemSettingService>(SystemSettingService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getSettings', () => {
    it('should return all settings successfully', async () => {
      const mockSettings = {
        'gsoc.current_year': 2026,
        'site.title': 'WebiU',
      };
      mockSystemSettingService.getAllSettings.mockResolvedValue(mockSettings);

      const result = await controller.getSettings();

      expect(result).toEqual({
        success: true,
        settings: mockSettings,
      });
      expect(service.getAllSettings).toHaveBeenCalled();
    });
  });

  describe('updateSettings', () => {
    it('should update and return settings successfully', async () => {
      const updates = { 'site.title': 'New Title' };
      const mockSettings = {
        'gsoc.current_year': 2026,
        'site.title': 'New Title',
      };
      mockSystemSettingService.updateSettings.mockResolvedValue(mockSettings);

      const result = await controller.updateSettings(updates);

      expect(result).toEqual({
        success: true,
        message: 'Settings updated successfully.',
        settings: mockSettings,
      });
      expect(service.updateSettings).toHaveBeenCalledWith(updates);
    });
  });
});

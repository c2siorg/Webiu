import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AnalyzerController } from './analyzer.controller';
import { AnalyzerService } from './analyzer.service';

describe('AnalyzerController', () => {
  let controller: AnalyzerController;

  const mockAnalyzerService = {
    analyzeRepositories: jest.fn(),
    syncStoredRepositories: jest.fn(),
    getStoredReports: jest.fn(),
    getStoredReport: jest.fn(),
    getSyncHistory: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AnalyzerController],
      providers: [{ provide: AnalyzerService, useValue: mockAnalyzerService }],
    }).compile();

    controller = module.get<AnalyzerController>(AnalyzerController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('analyze', () => {
    it('should pass repositories and options to service', async () => {
      const payload = {
        repositories: ['https://github.com/nestjs/nest'],
        forceRefresh: true,
      };
      const mockResult = { reports: [], syncRun: { id: 'run-1' } };
      mockAnalyzerService.analyzeRepositories.mockResolvedValue(mockResult);

      const result = await controller.analyze(payload);

      expect(result).toEqual(mockResult);
      expect(mockAnalyzerService.analyzeRepositories).toHaveBeenCalledWith(
        payload.repositories,
        {
          forceRefresh: true,
          persist: true,
        },
      );
    });
  });

  describe('syncNow', () => {
    it('should sync provided repositories when present in payload', async () => {
      const payload = {
        repositories: ['https://github.com/facebook/react'],
      };
      const mockResult = { reports: [{ fullName: 'facebook/react' }] };
      mockAnalyzerService.analyzeRepositories.mockResolvedValue(mockResult);

      const result = await controller.syncNow(payload);

      expect(result).toEqual(mockResult);
      expect(mockAnalyzerService.analyzeRepositories).toHaveBeenCalledWith(
        payload.repositories,
        {
          forceRefresh: true,
          persist: true,
        },
      );
      expect(mockAnalyzerService.syncStoredRepositories).not.toHaveBeenCalled();
    });

    it('should sync stored repositories when payload has no repositories', async () => {
      const mockResult = { reports: [] };
      mockAnalyzerService.syncStoredRepositories.mockResolvedValue(mockResult);

      const result = await controller.syncNow({});

      expect(result).toEqual(mockResult);
      expect(mockAnalyzerService.syncStoredRepositories).toHaveBeenCalled();
      expect(mockAnalyzerService.analyzeRepositories).not.toHaveBeenCalled();
    });
  });

  describe('getReports', () => {
    it('should return paginated reports from service', () => {
      const mockResult = {
        total: 1,
        page: 2,
        limit: 10,
        reports: [{ fullName: 'nestjs/nest' }],
      };
      mockAnalyzerService.getStoredReports.mockReturnValue(mockResult);

      const result = controller.getReports({ page: 2, limit: 10 });

      expect(result).toEqual(mockResult);
      expect(mockAnalyzerService.getStoredReports).toHaveBeenCalledWith(2, 10);
    });
  });

  describe('getReport', () => {
    it('should return report when found', () => {
      const report = { owner: 'nestjs', repo: 'nest', fullName: 'nestjs/nest' };
      mockAnalyzerService.getStoredReport.mockReturnValue(report);

      const result = controller.getReport('nestjs', 'nest');

      expect(result).toEqual(report);
      expect(mockAnalyzerService.getStoredReport).toHaveBeenCalledWith(
        'nestjs',
        'nest',
      );
    });

    it('should throw NotFoundException when report does not exist', () => {
      mockAnalyzerService.getStoredReport.mockReturnValue(null);

      expect(() => controller.getReport('missing', 'repo')).toThrow(
        NotFoundException,
      );
    });
  });

  describe('getSyncHistory', () => {
    it('should apply numeric bounds and call service', () => {
      const history = [{ id: 'run-1' }];
      mockAnalyzerService.getSyncHistory.mockReturnValue(history);

      const result = controller.getSyncHistory('999');

      expect(result).toEqual(history);
      expect(mockAnalyzerService.getSyncHistory).toHaveBeenCalledWith(100);
    });
  });
});

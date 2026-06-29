import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DashboardService } from './dashboard.service';
import { Repository as RepositoryEntity } from '../database/entities/repository.entity';
import { Contributor } from '../database/entities/contributor.entity';
import { GsocProgram } from '../database/entities/gsoc-program.entity';
import { GsocIdea } from '../database/entities/gsoc-idea.entity';
import { GsocMentor } from '../database/entities/gsoc-mentor.entity';
import { SystemSettingService } from '../system-setting/system-setting.service';
import { AuditLogService } from '../audit-log/audit-log.service';

describe('DashboardService', () => {
  let service: DashboardService;
  let repoRepository: jest.Mocked<Repository<RepositoryEntity>>;
  let contributorRepository: jest.Mocked<Repository<Contributor>>;
  let programRepository: jest.Mocked<Repository<GsocProgram>>;
  let ideaRepository: jest.Mocked<Repository<GsocIdea>>;
  let mentorRepository: jest.Mocked<Repository<GsocMentor>>;
  let systemSettingService: jest.Mocked<SystemSettingService>;
  let auditLogService: jest.Mocked<AuditLogService>;

  const mockRepoRepository = {
    count: jest.fn(),
    findOne: jest.fn(),
  };

  const mockContributorRepository = {
    count: jest.fn(),
  };

  const mockProgramRepository = {
    count: jest.fn(),
  };

  const mockIdeaRepository = {
    count: jest.fn(),
  };

  const mockMentorRepository = {
    count: jest.fn(),
  };

  const mockSystemSettingService = {
    getSettingBool: jest.fn(),
    getSetting: jest.fn(),
  };

  const mockAuditLogService = {
    findAll: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DashboardService,
        {
          provide: getRepositoryToken(RepositoryEntity),
          useValue: mockRepoRepository,
        },
        {
          provide: getRepositoryToken(Contributor),
          useValue: mockContributorRepository,
        },
        {
          provide: getRepositoryToken(GsocProgram),
          useValue: mockProgramRepository,
        },
        {
          provide: getRepositoryToken(GsocIdea),
          useValue: mockIdeaRepository,
        },
        {
          provide: getRepositoryToken(GsocMentor),
          useValue: mockMentorRepository,
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

    service = module.get<DashboardService>(DashboardService);
    repoRepository = module.get(getRepositoryToken(RepositoryEntity));
    contributorRepository = module.get(getRepositoryToken(Contributor));
    programRepository = module.get(getRepositoryToken(GsocProgram));
    ideaRepository = module.get(getRepositoryToken(GsocIdea));
    mentorRepository = module.get(getRepositoryToken(GsocMentor));
    systemSettingService = module.get(SystemSettingService);
    auditLogService = module.get(AuditLogService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getDashboardSummary', () => {
    it('should aggregate statistics and return dashboard summary correctly', async () => {
      repoRepository.count.mockResolvedValueOnce(27); // Total repos
      repoRepository.count.mockResolvedValueOnce(0); // Failed repos
      contributorRepository.count.mockResolvedValueOnce(1582);
      programRepository.count.mockResolvedValueOnce(4);
      ideaRepository.count.mockResolvedValueOnce(18); // Total ideas
      ideaRepository.count.mockResolvedValueOnce(12); // Published ideas
      ideaRepository.count.mockResolvedValueOnce(6); // Draft ideas
      mentorRepository.count.mockResolvedValueOnce(11);

      systemSettingService.getSettingBool.mockResolvedValueOnce(false); // Maintenance mode
      systemSettingService.getSetting.mockResolvedValueOnce('2026'); // Active year
      systemSettingService.getSettingBool.mockResolvedValueOnce(true); // showIdeasPage
      systemSettingService.getSettingBool.mockResolvedValueOnce(true); // registrationOpen

      const mockDate = new Date('2026-06-29T00:00:00Z');
      repoRepository.findOne.mockResolvedValueOnce({
        lastSyncedAt: mockDate,
      } as any); // latestRepo
      repoRepository.findOne.mockResolvedValueOnce({
        lastWebhookAt: mockDate,
      } as any); // latestWebhookRepo
      repoRepository.findOne.mockResolvedValueOnce({
        lastReconciliationAt: mockDate,
      } as any); // latestReconciliationRepo

      auditLogService.findAll.mockResolvedValueOnce({
        logs: [
          {
            id: 'log-1',
            action: 'update',
            entityType: 'gsoc_idea',
            entityId: 'idea-123',
            createdAt: mockDate,
            admin: { id: 'admin-1', username: 'john_doe' },
          },
        ],
      } as any);

      const result = await service.getDashboardSummary();

      expect(result).toEqual({
        repositories: 27,
        contributors: 1582,
        programs: 4,
        ideas: 18,
        mentors: 11,
        publishedIdeas: 12,
        draftIdeas: 6,
        maintenanceMode: false,
        activeGsocYear: 2026,
        showIdeasPage: true,
        registrationOpen: true,
        lastRepositorySync: mockDate,
        lastWebhookAt: mockDate,
        lastReconciliationAt: mockDate,
        syncHealth: 'Healthy',
        environment: 'test',
        recentAuditEvents: [
          {
            id: 'log-1',
            action: 'update',
            entityType: 'gsoc_idea',
            entityId: 'idea-123',
            createdAt: mockDate,
            admin: { id: 'admin-1', username: 'john_doe' },
          },
        ],
      });

      expect(repoRepository.count).toHaveBeenCalledTimes(2);
      expect(contributorRepository.count).toHaveBeenCalled();
      expect(programRepository.count).toHaveBeenCalled();
      expect(ideaRepository.count).toHaveBeenCalledTimes(3);
      expect(mentorRepository.count).toHaveBeenCalled();
    });

    it('should fall back to sync health Warning when there are failed repositories', async () => {
      repoRepository.count.mockResolvedValueOnce(27); // Total
      repoRepository.count.mockResolvedValueOnce(1); // Failed count > 0
      contributorRepository.count.mockResolvedValueOnce(10);
      programRepository.count.mockResolvedValueOnce(1);
      ideaRepository.count.mockResolvedValueOnce(5);
      ideaRepository.count.mockResolvedValueOnce(3);
      ideaRepository.count.mockResolvedValueOnce(2);
      mentorRepository.count.mockResolvedValueOnce(2);

      systemSettingService.getSettingBool.mockResolvedValueOnce(true); // Maintenance
      systemSettingService.getSetting.mockResolvedValueOnce('2025'); // Year
      systemSettingService.getSettingBool.mockResolvedValueOnce(false); // showIdeasPage
      systemSettingService.getSettingBool.mockResolvedValueOnce(false); // registrationOpen

      repoRepository.findOne.mockResolvedValue(null);
      auditLogService.findAll.mockResolvedValueOnce({ logs: [] } as any);

      const result = await service.getDashboardSummary();

      expect(result.syncHealth).toBe('Warning');
      expect(result.maintenanceMode).toBe(true);
      expect(result.activeGsocYear).toBe(2025);
      expect(result.showIdeasPage).toBe(false);
      expect(result.registrationOpen).toBe(false);
      expect(result.lastRepositorySync).toBeNull();
    });
  });
});

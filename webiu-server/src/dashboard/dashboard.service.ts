import {
  Injectable,
  Logger,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository as TypeOrmRepository } from 'typeorm';
import { Repository as RepositoryEntity } from '../database/entities/repository.entity';
import { Contributor } from '../database/entities/contributor.entity';
import { GsocProgram } from '../database/entities/gsoc-program.entity';
import { GsocIdea } from '../database/entities/gsoc-idea.entity';
import { GsocMentor } from '../database/entities/gsoc-mentor.entity';
import { SystemSettingService } from '../system-setting/system-setting.service';
import { AuditLogService } from '../audit-log/audit-log.service';

@Injectable()
export class DashboardService {
  private readonly logger = new Logger(DashboardService.name);

  constructor(
    @InjectRepository(RepositoryEntity)
    private readonly repoRepository: TypeOrmRepository<RepositoryEntity>,
    @InjectRepository(Contributor)
    private readonly contributorRepository: TypeOrmRepository<Contributor>,
    @InjectRepository(GsocProgram)
    private readonly programRepository: TypeOrmRepository<GsocProgram>,
    @InjectRepository(GsocIdea)
    private readonly ideaRepository: TypeOrmRepository<GsocIdea>,
    @InjectRepository(GsocMentor)
    private readonly mentorRepository: TypeOrmRepository<GsocMentor>,
    private readonly systemSettingService: SystemSettingService,
    private readonly auditLogService: AuditLogService,
  ) {}

  async getDashboardSummary() {
    try {
      const [
        repositories,
        contributors,
        programs,
        ideas,
        mentors,
        publishedIdeas,
        draftIdeas,
        maintenanceMode,
        activeGsocYear,
        showIdeasPage,
        registrationOpen,
        latestRepo,
        latestWebhookRepo,
        latestReconciliationRepo,
        failedReposCount,
        recentAuditEventsResult,
      ] = await Promise.all([
        this.repoRepository.count(),
        this.contributorRepository.count(),
        this.programRepository.count(),
        this.ideaRepository.count(),
        this.mentorRepository.count(),
        this.ideaRepository.count({ where: { status: 'PUBLISHED' } }),
        this.ideaRepository.count({ where: { status: 'DRAFT' } }),
        this.systemSettingService
          .getSettingBool('site.maintenance_mode')
          .catch(() => false),
        this.systemSettingService
          .getSetting('gsoc.current_year')
          .catch(() => '2026'),
        this.systemSettingService
          .getSettingBool('gsoc.show_ideas_page')
          .catch(() => true),
        this.systemSettingService
          .getSettingBool('gsoc.registration_open')
          .catch(() => true),
        this.repoRepository.findOne({
          where: {},
          order: { lastSyncedAt: 'DESC' },
        }),
        this.repoRepository.findOne({
          where: {},
          order: { lastWebhookAt: 'DESC' },
        }),
        this.repoRepository.findOne({
          where: {},
          order: { lastReconciliationAt: 'DESC' },
        }),
        this.repoRepository.count({ where: { syncStatus: 'failed' } }),
        this.auditLogService.findAll({ page: 1, limit: 5 }),
      ]);

      const lastRepositorySync = latestRepo ? latestRepo.lastSyncedAt : null;
      const lastWebhookAt = latestWebhookRepo
        ? latestWebhookRepo.lastWebhookAt
        : null;
      const lastReconciliationAt = latestReconciliationRepo
        ? latestReconciliationRepo.lastReconciliationAt
        : null;

      const syncHealth = failedReposCount > 0 ? 'Warning' : 'Healthy';

      // Format the recent audit events
      const recentAuditEvents = (recentAuditEventsResult.logs || []).map(
        (log) => ({
          id: log.id,
          action: log.action,
          entityType: log.entityType,
          entityId: log.entityId,
          createdAt: log.createdAt,
          admin: log.admin
            ? { id: log.admin.id, username: log.admin.username }
            : null,
        }),
      );

      return {
        repositories,
        contributors,
        programs,
        ideas,
        mentors,
        publishedIdeas,
        draftIdeas,
        maintenanceMode,
        activeGsocYear: Number(activeGsocYear) || 2026,
        showIdeasPage,
        registrationOpen,
        lastRepositorySync,
        lastWebhookAt,
        lastReconciliationAt,
        syncHealth,
        environment: process.env.NODE_ENV || 'development',
        recentAuditEvents,
      };
    } catch (error) {
      this.logger.error('Error compiling dashboard summary:', error.message);
      throw new InternalServerErrorException(
        'Failed to compile dashboard summary',
      );
    }
  }
}

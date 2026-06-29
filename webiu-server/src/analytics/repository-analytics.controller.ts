import { Controller, Get, UseGuards } from '@nestjs/common';
import { AdminGuard } from '../auth/guards/admin.guard';
import { RepositoryAnalyticsService } from './repository-analytics.service';

@Controller('admin/repositories')
@UseGuards(AdminGuard)
export class RepositoryAnalyticsController {
  constructor(
    private readonly repositoryAnalyticsService: RepositoryAnalyticsService,
  ) {}

  @Get()
  async getRepositoryAnalytics() {
    return this.repositoryAnalyticsService.getRepositoryAnalytics();
  }
}

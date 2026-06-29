import { Controller, Get, UseGuards } from '@nestjs/common';
import { AdminGuard } from '../auth/guards/admin.guard';
import { ContributorAnalyticsService } from './contributor-analytics.service';

@Controller('admin/contributors')
@UseGuards(AdminGuard)
export class AnalyticsController {
  constructor(
    private readonly contributorAnalyticsService: ContributorAnalyticsService,
  ) {}

  @Get()
  async getContributorAnalytics() {
    return this.contributorAnalyticsService.getContributorAnalytics();
  }
}

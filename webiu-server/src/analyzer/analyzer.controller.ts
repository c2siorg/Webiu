import {
  Body,
  Controller,
  Get,
  Header,
  NotFoundException,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import { AnalyzeRequestDto } from './dto/analyze-request.dto';
import { ReportQueryDto } from './dto/report-query.dto';
import { AnalyzerService } from './analyzer.service';

@Controller('api/analyzer')
export class AnalyzerController {
  constructor(private readonly analyzerService: AnalyzerService) {}

  @Post('analyze')
  async analyze(@Body() body: AnalyzeRequestDto) {
    return this.analyzerService.analyzeRepositories(body.repositories, {
      forceRefresh: body.forceRefresh,
      persist: true,
    });
  }

  @Post('sync')
  async syncNow(@Body() body: Partial<AnalyzeRequestDto>) {
    if (body?.repositories?.length) {
      return this.analyzerService.analyzeRepositories(body.repositories, {
        forceRefresh: true,
        persist: true,
      });
    }
    return this.analyzerService.syncStoredRepositories();
  }

  @Get('reports')
  @Header('Cache-Control', 'public, max-age=60')
  getReports(@Query() query: ReportQueryDto) {
    return this.analyzerService.getStoredReports(query.page, query.limit);
  }

  @Get('reports/:owner/:repo')
  @Header('Cache-Control', 'public, max-age=60')
  getReport(@Param('owner') owner: string, @Param('repo') repo: string) {
    const report = this.analyzerService.getStoredReport(owner, repo);
    if (!report) {
      throw new NotFoundException(`No report found for ${owner}/${repo}`);
    }
    return report;
  }

  @Get('sync-history')
  getSyncHistory(@Query('limit') limit = '20') {
    const numericLimit = Math.max(1, Math.min(100, parseInt(limit, 10) || 20));
    return this.analyzerService.getSyncHistory(numericLimit);
  }
}

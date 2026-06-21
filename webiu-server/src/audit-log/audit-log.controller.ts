import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { AuditLogService } from './audit-log.service';
import { AuditLogQueryDto } from './dto/audit-log-query.dto';
import { AdminGuard } from '../auth/guards/admin.guard';

@Controller('admin/audit')
@UseGuards(AdminGuard)
export class AuditLogController {
  constructor(private readonly auditLogService: AuditLogService) {}

  @Get()
  async getAuditLogs(@Query() query: AuditLogQueryDto) {
    const result = await this.auditLogService.findAll(query);
    return {
      success: true,
      ...result,
    };
  }

  @Get(':id')
  async getAuditLogDetails(@Param('id') id: string) {
    const log = await this.auditLogService.findOne(id);
    return {
      success: true,
      log,
    };
  }
}

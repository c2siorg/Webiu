import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLog } from '../database/entities/audit-log.entity';
import { AuditLogQueryDto } from './dto/audit-log-query.dto';

@Injectable()
export class AuditLogService {
  constructor(
    @InjectRepository(AuditLog)
    private readonly auditLogRepository: Repository<AuditLog>,
  ) {}

  async createLog(data: {
    adminId: string | null;
    action: string;
    entityType: string;
    entityId: string | null;
    oldValue?: string | null;
    newValue?: string | null;
    metadata?: Record<string, any> | null;
  }): Promise<AuditLog> {
    const log = this.auditLogRepository.create(data);
    return this.auditLogRepository.save(log);
  }

  async findAll(query: AuditLogQueryDto) {
    const {
      page = 1,
      limit = 20,
      action,
      entityType,
      startDate,
      endDate,
    } = query;
    const skip = (page - 1) * limit;

    const qb = this.auditLogRepository
      .createQueryBuilder('log')
      .leftJoin('log.admin', 'admin')
      .addSelect(['admin.id', 'admin.username'])
      .orderBy('log.createdAt', 'DESC')
      .take(limit)
      .skip(skip);

    if (action) {
      qb.andWhere('log.action = :action', { action });
    }

    if (entityType) {
      qb.andWhere('log.entityType = :entityType', { entityType });
    }

    if (startDate) {
      qb.andWhere('log.createdAt >= :startDate', {
        startDate: new Date(startDate),
      });
    }

    if (endDate) {
      // Extend end date to include the whole day (23:59:59.999) if only date is passed
      const end = new Date(endDate);
      if (endDate.length === 10) {
        end.setHours(23, 59, 59, 999);
      }
      qb.andWhere('log.createdAt <= :endDate', { endDate: end });
    }

    const [logs, total] = await qb.getManyAndCount();

    return {
      logs,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string): Promise<AuditLog> {
    const log = await this.auditLogRepository
      .createQueryBuilder('log')
      .leftJoin('log.admin', 'admin')
      .addSelect(['admin.id', 'admin.username'])
      .where('log.id = :id', { id })
      .getOne();

    if (!log) {
      throw new NotFoundException(`Audit log with ID "${id}" not found.`);
    }

    return log;
  }
}

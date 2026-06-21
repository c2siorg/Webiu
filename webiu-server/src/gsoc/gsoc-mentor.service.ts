import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GsocMentor } from '../database/entities/gsoc-mentor.entity';
import { CreateMentorDto } from './dto/create-mentor.dto';
import { UpdateMentorDto } from './dto/update-mentor.dto';
import { AuditLogService } from '../audit-log/audit-log.service';

@Injectable()
export class GsocMentorService {
  constructor(
    @InjectRepository(GsocMentor)
    private readonly mentorRepository: Repository<GsocMentor>,
    private readonly auditLogService: AuditLogService,
  ) {}

  async create(
    createMentorDto: CreateMentorDto,
    adminId?: string,
  ): Promise<GsocMentor> {
    const mentor = this.mentorRepository.create(createMentorDto);
    const saved = await this.mentorRepository.save(mentor);

    if (adminId) {
      await this.auditLogService.createLog({
        adminId,
        action: 'MENTOR_CREATED',
        entityType: 'mentor',
        entityId: saved.id,
        newValue: JSON.stringify(saved),
      });
    }

    return saved;
  }

  async findAll(): Promise<GsocMentor[]> {
    return this.mentorRepository.find({
      order: { name: 'ASC' },
    });
  }

  async findOne(id: string): Promise<GsocMentor> {
    const mentor = await this.mentorRepository.findOne({ where: { id } });
    if (!mentor) {
      throw new NotFoundException(`Mentor with ID "${id}" not found.`);
    }
    return mentor;
  }

  async update(
    id: string,
    updateMentorDto: UpdateMentorDto,
    adminId?: string,
  ): Promise<GsocMentor> {
    const mentor = await this.findOne(id);
    const oldState = { ...mentor };
    Object.assign(mentor, updateMentorDto);
    const saved = await this.mentorRepository.save(mentor);

    if (adminId) {
      await this.auditLogService.createLog({
        adminId,
        action: 'MENTOR_UPDATED',
        entityType: 'mentor',
        entityId: saved.id,
        oldValue: JSON.stringify(oldState),
        newValue: JSON.stringify(saved),
      });
    }

    return saved;
  }

  async remove(id: string, adminId?: string): Promise<void> {
    const mentor = await this.findOne(id);
    await this.mentorRepository.remove(mentor);

    if (adminId) {
      await this.auditLogService.createLog({
        adminId,
        action: 'MENTOR_DELETED',
        entityType: 'mentor',
        entityId: id,
        oldValue: JSON.stringify(mentor),
        newValue: null,
      });
    }
  }
}

import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GsocProgram } from '../database/entities/gsoc-program.entity';
import { CreateProgramDto } from './dto/create-program.dto';
import { UpdateProgramDto } from './dto/update-program.dto';
import { SystemSettingService } from '../system-setting/system-setting.service';
import { AuditLogService } from '../audit-log/audit-log.service';

@Injectable()
export class GsocProgramService {
  constructor(
    @InjectRepository(GsocProgram)
    private readonly programRepository: Repository<GsocProgram>,
    private readonly systemSettingService: SystemSettingService,
    private readonly auditLogService: AuditLogService,
  ) {}

  async create(
    createProgramDto: CreateProgramDto,
    adminId?: string,
  ): Promise<GsocProgram> {
    const existing = await this.programRepository.findOne({
      where: { year: createProgramDto.year },
    });
    if (existing) {
      throw new BadRequestException(
        `A GSoC program for the year ${createProgramDto.year} already exists.`,
      );
    }

    if (createProgramDto.isActive) {
      await this.deactivateAllPrograms();
    }

    const program = this.programRepository.create(createProgramDto);
    const saved = await this.programRepository.save(program);

    if (adminId) {
      await this.auditLogService.createLog({
        adminId,
        action: 'PROGRAM_CREATED',
        entityType: 'gsoc_program',
        entityId: saved.id,
        newValue: JSON.stringify(saved),
      });
    }

    return saved;
  }

  async findAll(): Promise<GsocProgram[]> {
    return this.programRepository.find({
      order: { year: 'DESC' },
    });
  }

  async findOne(id: string): Promise<GsocProgram> {
    const program = await this.programRepository.findOne({ where: { id } });
    if (!program) {
      throw new NotFoundException(`GSoC program with ID "${id}" not found.`);
    }
    return program;
  }

  async update(
    id: string,
    updateProgramDto: UpdateProgramDto,
    adminId?: string,
  ): Promise<GsocProgram> {
    const program = await this.findOne(id);
    const oldState = { ...program };

    if (updateProgramDto.year && updateProgramDto.year !== program.year) {
      const existing = await this.programRepository.findOne({
        where: { year: updateProgramDto.year },
      });
      if (existing) {
        throw new BadRequestException(
          `A GSoC program for the year ${updateProgramDto.year} already exists.`,
        );
      }
    }

    if (updateProgramDto.isActive === true) {
      await this.deactivateAllPrograms();
    }

    Object.assign(program, updateProgramDto);
    const saved = await this.programRepository.save(program);

    if (adminId) {
      let action = 'PROGRAM_UPDATED';
      if (
        updateProgramDto.status === 'PUBLISHED' &&
        oldState.status !== 'PUBLISHED'
      ) {
        action = 'PROGRAM_PUBLISHED';
      } else if (
        updateProgramDto.status === 'ARCHIVED' &&
        oldState.status !== 'ARCHIVED'
      ) {
        action = 'PROGRAM_ARCHIVED';
      }

      await this.auditLogService.createLog({
        adminId,
        action,
        entityType: 'gsoc_program',
        entityId: saved.id,
        oldValue: JSON.stringify(oldState),
        newValue: JSON.stringify(saved),
      });
    }

    return saved;
  }

  async remove(id: string, adminId?: string): Promise<void> {
    const program = await this.findOne(id);
    await this.programRepository.remove(program);

    if (adminId) {
      await this.auditLogService.createLog({
        adminId,
        action: 'PROGRAM_ARCHIVED',
        entityType: 'gsoc_program',
        entityId: id,
        oldValue: JSON.stringify(program),
        newValue: null,
      });
    }
  }

  async findCurrentPublicProgram(): Promise<GsocProgram> {
    // 1. Resolve current year using the existing system settings key "gsoc.current_year"
    const currentYear =
      await this.systemSettingService.getSettingNumber('gsoc.current_year');

    // 2. Fetch the published program corresponding to that year
    const program = await this.programRepository.findOne({
      where: { year: currentYear, status: 'PUBLISHED' },
    });

    if (!program) {
      throw new NotFoundException(
        `No published GSoC program found for year ${currentYear}.`,
      );
    }

    return program;
  }

  private async deactivateAllPrograms(): Promise<void> {
    await this.programRepository.update({}, { isActive: false });
  }
}

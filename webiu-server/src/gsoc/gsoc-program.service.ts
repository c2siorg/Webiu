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

@Injectable()
export class GsocProgramService {
  constructor(
    @InjectRepository(GsocProgram)
    private readonly programRepository: Repository<GsocProgram>,
    private readonly systemSettingService: SystemSettingService,
  ) {}

  async create(createProgramDto: CreateProgramDto): Promise<GsocProgram> {
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
    return this.programRepository.save(program);
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
  ): Promise<GsocProgram> {
    const program = await this.findOne(id);

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
    return this.programRepository.save(program);
  }

  async remove(id: string): Promise<void> {
    const program = await this.findOne(id);
    await this.programRepository.remove(program);
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

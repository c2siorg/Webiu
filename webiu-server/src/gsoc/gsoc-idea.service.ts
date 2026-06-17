import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { GsocIdea } from '../database/entities/gsoc-idea.entity';
import { GsocProgram } from '../database/entities/gsoc-program.entity';
import { GsocMentor } from '../database/entities/gsoc-mentor.entity';
import { CreateIdeaDto } from './dto/create-idea.dto';
import { UpdateIdeaDto } from './dto/update-idea.dto';
import { SystemSettingService } from '../system-setting/system-setting.service';

@Injectable()
export class GsocIdeaService {
  constructor(
    @InjectRepository(GsocIdea)
    private readonly ideaRepository: Repository<GsocIdea>,
    @InjectRepository(GsocProgram)
    private readonly programRepository: Repository<GsocProgram>,
    @InjectRepository(GsocMentor)
    private readonly mentorRepository: Repository<GsocMentor>,
    private readonly systemSettingService: SystemSettingService,
  ) {}

  async create(createIdeaDto: CreateIdeaDto): Promise<GsocIdea> {
    const program = await this.programRepository.findOne({
      where: { id: createIdeaDto.programId },
    });
    if (!program) {
      throw new BadRequestException(
        `GSoC Program with ID "${createIdeaDto.programId}" does not exist.`,
      );
    }

    let mentors: GsocMentor[] = [];
    if (createIdeaDto.mentorIds && createIdeaDto.mentorIds.length > 0) {
      mentors = await this.mentorRepository.find({
        where: { id: In(createIdeaDto.mentorIds) },
      });
      if (mentors.length !== createIdeaDto.mentorIds.length) {
        throw new BadRequestException('One or more mentor IDs are invalid.');
      }
    }

    // Assign displayOrder automatically if not provided
    let displayOrder = createIdeaDto.displayOrder;
    if (displayOrder === undefined) {
      const maxIdea = await this.ideaRepository.findOne({
        where: { programId: createIdeaDto.programId },
        order: { displayOrder: 'DESC' },
      });
      displayOrder = maxIdea ? maxIdea.displayOrder + 1 : 0;
    }

    const idea = this.ideaRepository.create({
      ...createIdeaDto,
      displayOrder,
      mentors,
    });

    return this.ideaRepository.save(idea);
  }

  async findAll(programId?: string): Promise<GsocIdea[]> {
    const queryBuilder = this.ideaRepository
      .createQueryBuilder('idea')
      .leftJoinAndSelect('idea.mentors', 'mentor');

    if (programId) {
      queryBuilder.where('idea.programId = :programId', { programId });
    }

    return queryBuilder
      .orderBy('idea.displayOrder', 'ASC')
      .addOrderBy('idea.projectNumber', 'ASC')
      .getMany();
  }

  async findOne(id: string): Promise<GsocIdea> {
    const idea = await this.ideaRepository.findOne({
      where: { id },
      relations: ['mentors'],
    });
    if (!idea) {
      throw new NotFoundException(`Project idea with ID "${id}" not found.`);
    }
    return idea;
  }

  async update(id: string, updateIdeaDto: UpdateIdeaDto): Promise<GsocIdea> {
    const idea = await this.findOne(id);

    if (updateIdeaDto.programId && updateIdeaDto.programId !== idea.programId) {
      const program = await this.programRepository.findOne({
        where: { id: updateIdeaDto.programId },
      });
      if (!program) {
        throw new BadRequestException(
          `GSoC Program with ID "${updateIdeaDto.programId}" does not exist.`,
        );
      }
    }

    if (updateIdeaDto.mentorIds) {
      const mentors = await this.mentorRepository.find({
        where: { id: In(updateIdeaDto.mentorIds) },
      });
      if (mentors.length !== updateIdeaDto.mentorIds.length) {
        throw new BadRequestException('One or more mentor IDs are invalid.');
      }
      idea.mentors = mentors;
    }

    // Exclude mentorIds since we handled relation manually
    const scalarFields = { ...updateIdeaDto };
    delete scalarFields.mentorIds;
    Object.assign(idea, scalarFields);

    return this.ideaRepository.save(idea);
  }

  async remove(id: string): Promise<void> {
    const idea = await this.findOne(id);
    await this.ideaRepository.remove(idea);
  }

  async reorder(orderedIds: string[]): Promise<void> {
    for (let i = 0; i < orderedIds.length; i++) {
      await this.ideaRepository.update(orderedIds[i], { displayOrder: i });
    }
  }

  async findCurrentPublicIdeas(): Promise<GsocIdea[]> {
    const currentYear =
      await this.systemSettingService.getSettingNumber('gsoc.current_year');

    return this.ideaRepository.find({
      relations: ['mentors', 'program'],
      where: {
        status: 'PUBLISHED',
        program: {
          year: currentYear,
          status: 'PUBLISHED',
        },
      },
      order: {
        displayOrder: 'ASC',
        projectNumber: 'ASC',
      },
    });
  }
}

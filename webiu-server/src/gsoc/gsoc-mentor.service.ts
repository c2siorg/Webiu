import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GsocMentor } from '../database/entities/gsoc-mentor.entity';
import { CreateMentorDto } from './dto/create-mentor.dto';
import { UpdateMentorDto } from './dto/update-mentor.dto';

@Injectable()
export class GsocMentorService {
  constructor(
    @InjectRepository(GsocMentor)
    private readonly mentorRepository: Repository<GsocMentor>,
  ) {}

  async create(createMentorDto: CreateMentorDto): Promise<GsocMentor> {
    const mentor = this.mentorRepository.create(createMentorDto);
    return this.mentorRepository.save(mentor);
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
  ): Promise<GsocMentor> {
    const mentor = await this.findOne(id);
    Object.assign(mentor, updateMentorDto);
    return this.mentorRepository.save(mentor);
  }

  async remove(id: string): Promise<void> {
    const mentor = await this.findOne(id);
    await this.mentorRepository.remove(mentor);
  }
}

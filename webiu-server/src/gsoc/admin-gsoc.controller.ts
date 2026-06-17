import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  Query,
  HttpCode,
} from '@nestjs/common';
import { AdminGuard } from '../auth/guards/admin.guard';
import { GsocProgramService } from './gsoc-program.service';
import { GsocIdeaService } from './gsoc-idea.service';
import { GsocMentorService } from './gsoc-mentor.service';
import { CreateProgramDto } from './dto/create-program.dto';
import { UpdateProgramDto } from './dto/update-program.dto';
import { CreateIdeaDto } from './dto/create-idea.dto';
import { UpdateIdeaDto } from './dto/update-idea.dto';
import { CreateMentorDto } from './dto/create-mentor.dto';
import { UpdateMentorDto } from './dto/update-mentor.dto';

@Controller('admin/gsoc')
@UseGuards(AdminGuard)
export class AdminGsocController {
  constructor(
    private readonly programService: GsocProgramService,
    private readonly ideaService: GsocIdeaService,
    private readonly mentorService: GsocMentorService,
  ) {}

  // --- Programs ---
  @Get('programs')
  async getPrograms() {
    const programs = await this.programService.findAll();
    return { success: true, programs };
  }

  @Post('programs')
  async createProgram(@Body() dto: CreateProgramDto) {
    const program = await this.programService.create(dto);
    return {
      success: true,
      message: 'GSoC program created successfully',
      program,
    };
  }

  @Patch('programs/:id')
  async updateProgram(@Param('id') id: string, @Body() dto: UpdateProgramDto) {
    const program = await this.programService.update(id, dto);
    return {
      success: true,
      message: 'GSoC program updated successfully',
      program,
    };
  }

  @Delete('programs/:id')
  async deleteProgram(@Param('id') id: string) {
    await this.programService.remove(id);
    return { success: true, message: 'GSoC program deleted successfully' };
  }

  // --- Ideas ---
  @Get('ideas')
  async getIdeas(@Query('programId') programId?: string) {
    const ideas = await this.ideaService.findAll(programId);
    return { success: true, ideas };
  }

  @Post('ideas')
  async createIdea(@Body() dto: CreateIdeaDto) {
    const idea = await this.ideaService.create(dto);
    return {
      success: true,
      message: 'Project idea created successfully',
      idea,
    };
  }

  @Patch('ideas/reorder')
  @HttpCode(200)
  async reorderIdeas(@Body('orderedIds') orderedIds: string[]) {
    if (!orderedIds || !Array.isArray(orderedIds)) {
      return { success: false, message: 'orderedIds must be an array' };
    }
    await this.ideaService.reorder(orderedIds);
    return { success: true, message: 'Project ideas reordered successfully' };
  }

  @Patch('ideas/:id')
  async updateIdea(@Param('id') id: string, @Body() dto: UpdateIdeaDto) {
    const idea = await this.ideaService.update(id, dto);
    return {
      success: true,
      message: 'Project idea updated successfully',
      idea,
    };
  }

  @Delete('ideas/:id')
  async deleteIdea(@Param('id') id: string) {
    await this.ideaService.remove(id);
    return { success: true, message: 'Project idea deleted successfully' };
  }

  // --- Mentors ---
  @Get('mentors')
  async getMentors() {
    const mentors = await this.mentorService.findAll();
    return { success: true, mentors };
  }

  @Post('mentors')
  async createMentor(@Body() dto: CreateMentorDto) {
    const mentor = await this.mentorService.create(dto);
    return { success: true, message: 'Mentor created successfully', mentor };
  }

  @Patch('mentors/:id')
  async updateMentor(@Param('id') id: string, @Body() dto: UpdateMentorDto) {
    const mentor = await this.mentorService.update(id, dto);
    return { success: true, message: 'Mentor updated successfully', mentor };
  }

  @Delete('mentors/:id')
  async deleteMentor(@Param('id') id: string) {
    await this.mentorService.remove(id);
    return { success: true, message: 'Mentor deleted successfully' };
  }
}

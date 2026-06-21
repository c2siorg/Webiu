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
  Req,
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
  async createProgram(@Req() req: any, @Body() dto: CreateProgramDto) {
    const program = await this.programService.create(dto, req.user.id);
    return {
      success: true,
      message: 'GSoC program created successfully',
      program,
    };
  }

  @Patch('programs/:id')
  async updateProgram(
    @Req() req: any,
    @Param('id') id: string,
    @Body() dto: UpdateProgramDto,
  ) {
    const program = await this.programService.update(id, dto, req.user.id);
    return {
      success: true,
      message: 'GSoC program updated successfully',
      program,
    };
  }

  @Delete('programs/:id')
  async deleteProgram(@Req() req: any, @Param('id') id: string) {
    await this.programService.remove(id, req.user.id);
    return { success: true, message: 'GSoC program deleted successfully' };
  }

  // --- Ideas ---
  @Get('ideas')
  async getIdeas(@Query('programId') programId?: string) {
    const ideas = await this.ideaService.findAll(programId);
    return { success: true, ideas };
  }

  @Post('ideas')
  async createIdea(@Req() req: any, @Body() dto: CreateIdeaDto) {
    const idea = await this.ideaService.create(dto, req.user.id);
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
  async updateIdea(
    @Req() req: any,
    @Param('id') id: string,
    @Body() dto: UpdateIdeaDto,
  ) {
    const idea = await this.ideaService.update(id, dto, req.user.id);
    return {
      success: true,
      message: 'Project idea updated successfully',
      idea,
    };
  }

  @Delete('ideas/:id')
  async deleteIdea(@Req() req: any, @Param('id') id: string) {
    await this.ideaService.remove(id, req.user.id);
    return { success: true, message: 'Project idea deleted successfully' };
  }

  // --- Mentors ---
  @Get('mentors')
  async getMentors() {
    const mentors = await this.mentorService.findAll();
    return { success: true, mentors };
  }

  @Post('mentors')
  async createMentor(@Req() req: any, @Body() dto: CreateMentorDto) {
    const mentor = await this.mentorService.create(dto, req.user.id);
    return { success: true, message: 'Mentor created successfully', mentor };
  }

  @Patch('mentors/:id')
  async updateMentor(
    @Req() req: any,
    @Param('id') id: string,
    @Body() dto: UpdateMentorDto,
  ) {
    const mentor = await this.mentorService.update(id, dto, req.user.id);
    return { success: true, message: 'Mentor updated successfully', mentor };
  }

  @Delete('mentors/:id')
  async deleteMentor(@Req() req: any, @Param('id') id: string) {
    await this.mentorService.remove(id, req.user.id);
    return { success: true, message: 'Mentor deleted successfully' };
  }
}

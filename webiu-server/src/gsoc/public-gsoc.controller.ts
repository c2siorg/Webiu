import { Controller, Get, Header } from '@nestjs/common';
import { GsocProgramService } from './gsoc-program.service';
import { GsocIdeaService } from './gsoc-idea.service';

@Controller('gsoc')
export class PublicGsocController {
  constructor(
    private readonly programService: GsocProgramService,
    private readonly ideaService: GsocIdeaService,
  ) {}

  @Get('current')
  @Header('Cache-Control', 'public, max-age=300')
  async getCurrentProgram() {
    const program = await this.programService.findCurrentPublicProgram();
    return { success: true, program };
  }

  @Get('current/ideas')
  @Header('Cache-Control', 'public, max-age=300')
  async getCurrentIdeas() {
    const ideas = await this.ideaService.findCurrentPublicIdeas();
    return { success: true, ideas };
  }
}

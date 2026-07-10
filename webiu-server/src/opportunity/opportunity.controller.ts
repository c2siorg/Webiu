import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { OpportunityService } from './opportunity.service';
import {
  CreateOpportunityDto,
  UpdateOpportunityDto,
} from './dto/opportunity.dto';
import { Opportunity } from './schemas/opportunity.schema';

@Controller('api/opportunities')
export class OpportunityController {
  constructor(private readonly opportunityService: OpportunityService) {}

  @Get()
  async getPublished(): Promise<Opportunity[]> {
    return this.opportunityService.findPublished();
  }

  @Get('admin')
  async getAll(): Promise<Opportunity[]> {
    return this.opportunityService.findAll();
  }

  @Get(':id')
  async getOne(@Param('id') id: string): Promise<Opportunity> {
    return this.opportunityService.findOne(id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() dto: CreateOpportunityDto): Promise<Opportunity> {
    return this.opportunityService.create(dto);
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateOpportunityDto,
  ): Promise<Opportunity> {
    return this.opportunityService.update(id, dto);
  }

  @Delete(':id')
  async delete(@Param('id') id: string): Promise<{ deleted: boolean }> {
    return this.opportunityService.delete(id);
  }
}

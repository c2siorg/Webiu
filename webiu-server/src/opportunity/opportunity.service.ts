import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  Opportunity,
  OpportunityDocument,
  OpportunityStatus,
} from './schemas/opportunity.schema';
import {
  CreateOpportunityDto,
  UpdateOpportunityDto,
} from './dto/opportunity.dto';

@Injectable()
export class OpportunityService {
  constructor(
    @InjectModel(Opportunity.name)
    private opportunityModel: Model<OpportunityDocument>,
  ) {}

  async findAll(): Promise<Opportunity[]> {
    return this.opportunityModel
      .find()
      .sort({ displayOrder: 1, createdAt: -1 })
      .exec();
  }

  async findPublished(): Promise<Opportunity[]> {
    return this.opportunityModel
      .find({ status: OpportunityStatus.PUBLISHED })
      .sort({ displayOrder: 1, createdAt: -1 })
      .exec();
  }

  async findOne(id: string): Promise<Opportunity> {
    const opp = await this.opportunityModel.findById(id).exec();
    if (!opp) {
      throw new NotFoundException(`Opportunity with ID ${id} not found`);
    }
    return opp;
  }

  async create(dto: CreateOpportunityDto): Promise<Opportunity> {
    const created = new this.opportunityModel(dto);
    return created.save();
  }

  async update(id: string, dto: UpdateOpportunityDto): Promise<Opportunity> {
    const updated = await this.opportunityModel
      .findByIdAndUpdate(id, dto, { new: true })
      .exec();
    if (!updated) {
      throw new NotFoundException(`Opportunity with ID ${id} not found`);
    }
    return updated;
  }

  async delete(id: string): Promise<{ deleted: boolean }> {
    const result = await this.opportunityModel.findByIdAndDelete(id).exec();
    if (!result) {
      throw new NotFoundException(`Opportunity with ID ${id} not found`);
    }
    return { deleted: true };
  }
}

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type OpportunityDocument = Opportunity & Document;

export enum OpportunityStatus {
  DRAFT = 'Draft',
  PUBLISHED = 'Published',
  CLOSED = 'Closed',
}

@Schema({ timestamps: true })
export class Opportunity {
  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  opportunityType: string;

  @Prop({ required: true })
  organization: string;

  @Prop({ required: true })
  description: string;

  @Prop({ type: [String], default: [] })
  requirements: string[];

  @Prop({ default: 'Apply Now' })
  applyButtonText: string;

  @Prop({ required: true })
  applyDestinationUrl: string;

  @Prop({
    type: String,
    enum: OpportunityStatus,
    default: OpportunityStatus.DRAFT,
  })
  status: OpportunityStatus;

  @Prop({ default: 0 })
  displayOrder: number;
}

export const OpportunitySchema = SchemaFactory.createForClass(Opportunity);

import {
  IsArray,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';
import { OpportunityStatus } from '../schemas/opportunity.schema';

export class CreateOpportunityDto {
  @IsNotEmpty()
  @IsString()
  title: string;

  @IsNotEmpty()
  @IsString()
  opportunityType: string;

  @IsNotEmpty()
  @IsString()
  organization: string;

  @IsNotEmpty()
  @IsString()
  description: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  requirements?: string[];

  @IsOptional()
  @IsString()
  applyButtonText?: string;

  @IsNotEmpty()
  @IsString()
  applyDestinationUrl: string;

  @IsOptional()
  @IsEnum(OpportunityStatus)
  status?: OpportunityStatus;

  @IsOptional()
  @IsInt()
  displayOrder?: number;
}

export class UpdateOpportunityDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  opportunityType?: string;

  @IsOptional()
  @IsString()
  organization?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  requirements?: string[];

  @IsOptional()
  @IsString()
  applyButtonText?: string;

  @IsOptional()
  @IsString()
  applyDestinationUrl?: string;

  @IsOptional()
  @IsEnum(OpportunityStatus)
  status?: OpportunityStatus;

  @IsOptional()
  @IsInt()
  displayOrder?: number;
}

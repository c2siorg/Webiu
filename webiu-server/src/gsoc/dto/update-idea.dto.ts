import {
  IsInt,
  IsString,
  IsOptional,
  IsUUID,
  IsIn,
  Min,
  IsArray,
} from 'class-validator';

export class UpdateIdeaDto {
  @IsUUID()
  @IsOptional()
  programId?: string;

  @IsInt()
  @Min(1)
  @IsOptional()
  projectNumber?: number;

  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  explanation?: string;

  @IsString()
  @IsOptional()
  expectedResults?: string;

  @IsString()
  @IsOptional()
  prerequisites?: string;

  @IsString()
  @IsIn(['Easy', 'Medium', 'Hard'])
  @IsOptional()
  difficulty?: string;

  @IsInt()
  @IsOptional()
  durationHours?: number;

  @IsString()
  @IsOptional()
  slackChannel?: string;

  @IsString()
  @IsOptional()
  githubUrl?: string;

  @IsString()
  @IsOptional()
  @IsIn(['DRAFT', 'PUBLISHED', 'ARCHIVED'])
  status?: string;

  @IsInt()
  @IsOptional()
  displayOrder?: number;

  @IsArray()
  @IsUUID(undefined, { each: true })
  @IsOptional()
  mentorIds?: string[];
}

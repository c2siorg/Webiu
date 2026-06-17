import {
  IsInt,
  IsString,
  IsNotEmpty,
  IsOptional,
  IsUUID,
  IsIn,
  Min,
  IsArray,
} from 'class-validator';

export class CreateIdeaDto {
  @IsUUID()
  @IsNotEmpty()
  programId: string;

  @IsInt()
  @Min(1)
  projectNumber: number;

  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  explanation: string;

  @IsString()
  @IsOptional()
  expectedResults?: string;

  @IsString()
  @IsOptional()
  prerequisites?: string;

  @IsString()
  @IsIn(['Easy', 'Medium', 'Hard'])
  difficulty: string;

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

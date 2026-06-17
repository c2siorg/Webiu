import {
  IsInt,
  IsString,
  IsNotEmpty,
  IsOptional,
  IsBoolean,
  IsIn,
  Min,
  Max,
} from 'class-validator';

export class CreateProgramDto {
  @IsInt()
  @Min(2000)
  @Max(2100)
  year: number;

  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  heroImageUrl?: string;

  @IsString()
  @IsOptional()
  introHtml?: string;

  @IsString()
  @IsOptional()
  slackUrl?: string;

  @IsString()
  @IsOptional()
  proposalTemplateUrl?: string;

  @IsString()
  @IsOptional()
  githubOrgUrl?: string;

  @IsString()
  @IsOptional()
  @IsIn(['DRAFT', 'PUBLISHED', 'ARCHIVED'])
  status?: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

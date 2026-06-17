import {
  IsInt,
  IsString,
  IsOptional,
  IsBoolean,
  IsIn,
  Min,
  Max,
} from 'class-validator';

export class UpdateProgramDto {
  @IsInt()
  @Min(2000)
  @Max(2100)
  @IsOptional()
  year?: number;

  @IsString()
  @IsOptional()
  title?: string;

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

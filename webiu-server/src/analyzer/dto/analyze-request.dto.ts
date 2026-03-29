import {
  IsArray,
  ArrayNotEmpty,
  IsString,
  IsOptional,
  IsBoolean,
} from 'class-validator';

export class AnalyzeRequestDto {
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  repositories: string[];

  @IsOptional()
  @IsBoolean()
  forceRefresh?: boolean;
}

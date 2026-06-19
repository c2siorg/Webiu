import { IsString, IsOptional } from 'class-validator';

export class UpdateMentorDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  githubHandle?: string;
}

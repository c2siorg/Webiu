import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class CreateMentorDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  githubHandle?: string;
}

import {
  IsArray,
  IsString,
  ArrayNotEmpty,
  ArrayMaxSize,
} from 'class-validator';

export class BatchSocialDto {
  @IsArray()
  @ArrayNotEmpty()
  @ArrayMaxSize(500)
  @IsString({ each: true })
  usernames: string[];
}

import {
  IsArray,
  IsString,
  ArrayNotEmpty,
  ArrayMaxSize,
  Matches,
} from 'class-validator';

export class BatchSocialDto {
  @IsArray()
  @ArrayNotEmpty()
  @ArrayMaxSize(500)
  @IsString({ each: true })
  @Matches(/^[a-zA-Z0-9_-]+$/, {
    each: true,
    message:
      'Each username can only contain letters, numbers, hyphens, and underscores',
  })
  usernames: string[];
}

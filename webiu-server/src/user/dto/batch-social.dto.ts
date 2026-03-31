import {
  IsArray,
  ArrayNotEmpty,
  ArrayMaxSize,
  IsString,
  Length,
  Matches,
} from 'class-validator';

export class BatchSocialDto {
  @IsArray()
  @ArrayNotEmpty()
  @ArrayMaxSize(100)
  @IsString({ each: true })
  @Length(1, 39, { each: true })
  @Matches(/^(?!-)(?!.*--)[a-zA-Z0-9-]+(?<!-)$/, {
    each: true,
    message: 'Invalid GitHub username format',
  })
  usernames: string[];
}
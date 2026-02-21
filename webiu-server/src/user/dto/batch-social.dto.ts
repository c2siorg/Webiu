import {
  IsArray,
  IsString,
  ArrayNotEmpty,
  ArrayMaxSize,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class BatchSocialDto {
  @ApiProperty({
    description: 'List of GitHub usernames',
    example: ['user1', 'user2'],
    type: [String],
    maxItems: 500,
  })
  @IsArray()
  @ArrayNotEmpty()
  @ArrayMaxSize(500)
  @IsString({ each: true })
  usernames: string[];
}

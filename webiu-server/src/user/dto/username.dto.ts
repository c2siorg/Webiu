import { IsString, IsNotEmpty, Matches, Length } from 'class-validator';
import { Transform } from 'class-transformer';

export class UsernameDto {
  @IsString({ message: 'Username must be a string' })
  @IsNotEmpty({ message: 'Username cannot be empty' })
  @Length(1, 39, { message: 'GitHub username must be 1-39 characters long' })
  @Matches(
    /^[a-z\d](?:[a-z\d]|-(?=[a-z\d])){0,38}$/i,
    {
      message: 'Invalid GitHub username format (alphanumeric + single hyphens only)',
    }
  ) 
  @Transform(({ value }) => value?.toString().trim().toLowerCase())
  username: string;
}
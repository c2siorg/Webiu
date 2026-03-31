import { IsString, Length, Matches } from 'class-validator';

export class UsernameDto {
  @IsString()
  @Length(1, 39)
  @Matches(/^(?!-)(?!.*--)[a-zA-Z0-9-]+(?<!-)$/, {
    message:
      'Username must be 1-39 characters, alphanumeric or hyphens, no leading/trailing/consecutive hyphens',
  })
  username: string;
}
import { IsNotEmpty, Matches, MaxLength } from 'class-validator';

export class UsernameDto {
  @IsNotEmpty({ message: 'Username is required' })
  @Matches(/^[a-zA-Z0-9_-]+$/, {
    message:
      'Username can only contain letters, numbers, hyphens, and underscores',
  })
  @MaxLength(39, {
    message: 'Username cannot exceed 39 characters (GitHub limit)',
  })
  username: string;
}

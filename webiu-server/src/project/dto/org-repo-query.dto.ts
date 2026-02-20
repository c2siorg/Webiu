import { IsNotEmpty, Matches, MaxLength } from 'class-validator';

export class OrgRepoQueryDto {
  @IsNotEmpty({ message: 'Organization name is required' })
  @Matches(/^[a-zA-Z0-9_-]+$/, {
    message:
      'Organization name can only contain letters, numbers, hyphens, and underscores',
  })
  @MaxLength(39, { message: 'Organization name cannot exceed 39 characters' })
  org: string;

  @IsNotEmpty({ message: 'Repository name is required' })
  @Matches(/^[a-zA-Z0-9._-]+$/, {
    message:
      'Repository name can only contain letters, numbers, hyphens, underscores, and dots',
  })
  @MaxLength(100, { message: 'Repository name cannot exceed 100 characters' })
  repo: string;
}

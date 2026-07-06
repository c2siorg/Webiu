import {
  Injectable,
  Logger,
  InternalServerErrorException,
} from '@nestjs/common';
import { GithubService } from '../github/github.service';

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);

  constructor(private githubService: GithubService) {}

  async getFollowersAndFollowing(username: string) {
    try {
      return await this.githubService.getUserFollowersAndFollowing(username);
    } catch (error) {
      this.logger.error(
        'Error fetching followers and following:',
        error.response ? error.response.data : error.message,
      );
      throw new InternalServerErrorException('Internal server error');
    }
  }

  async batchFollowersAndFollowing(
    usernames: string[],
  ): Promise<Record<string, { followers: number; following: number }>> {
    const map: Record<string, { followers: number; following: number }> = {};
    const BATCH_SIZE = 10;

    for (let i = 0; i < usernames.length; i += BATCH_SIZE) {
      const batch = usernames.slice(i, i + BATCH_SIZE);
      const results = await Promise.allSettled(
        batch.map((username) =>
          this.githubService
            .getUserFollowersAndFollowing(username)
            .then((data) => ({ username, ...data })),
        ),
      );

      for (const result of results) {
        if (result.status === 'fulfilled') {
          const { username, followers, following } = result.value;
          map[username] = { followers, following };
        }
      }
    }

    return map;
  }

  async getUserProfile(username: string) {
    try {
      return await this.githubService.getPublicUserProfile(username);
    } catch (error) {
      this.logger.error(
        'Error fetching user profile:',
        error.response ? error.response.data : error.message,
      );
      throw new InternalServerErrorException('Failed to fetch user profile');
    }
  }
}

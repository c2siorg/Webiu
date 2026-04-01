import { Injectable } from '@nestjs/common';
import { GithubService } from '../github/github.service';

@Injectable()
export class UserService {
  constructor(private githubService: GithubService) {}

  async getFollowersAndFollowing(username: string) {
    return this.githubService.getUserFollowersAndFollowing(username);
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
    return this.githubService.getPublicUserProfile(username);
  }
}

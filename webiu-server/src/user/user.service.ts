import { Injectable } from '@nestjs/common';

@Injectable()
export class UserService {
  async getFollowersAndFollowing(_username: string) {
    // Placeholder implementation (same as original)
    return { 0: 0 };
  }
}

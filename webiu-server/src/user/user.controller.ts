import { Controller, Get, Post, Param, Body, Header } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { UserService } from './user.service';
import { BatchSocialDto } from './dto/batch-social.dto';

@Controller('api/user')
export class UserController {
  constructor(private userService: UserService) {}

  @Get('followersAndFollowing/:username')
  @Header('Cache-Control', 'public, max-age=300')
  async getFollowersAndFollowing(@Param('username') username: string) {
    return this.userService.getFollowersAndFollowing(username);
  }

  @Post('batch-social')
  @Throttle({ default: { ttl: 60_000, limit: 120 } })
  async batchSocial(@Body() dto: BatchSocialDto) {
    return this.userService.batchFollowersAndFollowing(dto.usernames);
  }

  @Get('profile/:username')
  @Header('Cache-Control', 'public, max-age=300')
  async getUserProfile(@Param('username') username: string) {
    return this.userService.getUserProfile(username);
  }
}

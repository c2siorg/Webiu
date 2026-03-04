import { Controller, Get, Post, Param, Body } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { UserService } from './user.service';
import { BatchSocialDto } from './dto/batch-social.dto';
import { UsernameDto } from './dto/username.dto';   // ← NEW

@Controller('api/user')
export class UserController {
  constructor(private userService: UserService) {}

  @Get('followersAndFollowing/:username')
  async getFollowersAndFollowing(@Param() params: UsernameDto) {   // ← CHANGED
    return this.userService.getFollowersAndFollowing(params.username);
  }

  @Post('batch-social')
  @Throttle({ default: { ttl: 60_000, limit: 120 } })
  async batchSocial(@Body() dto: BatchSocialDto) {
    return this.userService.batchFollowersAndFollowing(dto.usernames);
  }

  @Get('profile/:username')
  async getUserProfile(@Param() params: UsernameDto) {             // ← CHANGED
    return this.userService.getUserProfile(params.username);
  }
}
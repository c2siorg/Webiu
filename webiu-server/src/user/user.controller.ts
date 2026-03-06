import { Controller, Get, Post, Param, Body } from '@nestjs/common';
import { UserService } from './user.service';
import { BatchSocialDto } from './dto/batch-social.dto';
import { UsernameDto } from '../common/dto/username.dto';

@Controller('api/v1/user')
export class UserController {
  constructor(private userService: UserService) { }

  @Get('followersAndFollowing/:username')
  async getFollowersAndFollowing(@Param() params: UsernameDto) {
    return this.userService.getFollowersAndFollowing(params.username);
  }

  @Post('batch-social')
  async batchSocial(@Body() dto: BatchSocialDto) {
    return this.userService.batchFollowersAndFollowing(dto.usernames);
  }

  @Get('profile/:username')
  async getUserProfile(@Param() params: UsernameDto) {
    return this.userService.getUserProfile(params.username);
  }
}

import { Controller, Get, Post, Param, Body, Header } from '@nestjs/common';
import { UserService } from './user.service';
import { BatchSocialDto } from './dto/batch-social.dto';
import { UsernameDto } from '../common/dto/username.dto';

@Controller('api/v1/user')
export class UserController {
  constructor(private userService: UserService) {}

  @Get('followersAndFollowing/:username')
  @Header('Cache-Control', 'public, max-age=300')
  async getFollowersAndFollowing(@Param() params: UsernameDto) {
    return this.userService.getFollowersAndFollowing(params.username);
  }

  @Post('batch-social')
  async batchSocial(@Body() dto: BatchSocialDto) {
    return this.userService.batchFollowersAndFollowing(dto.usernames);
  }

  @Get('profile/:username')
  @Header('Cache-Control', 'public, max-age=300')
  async getUserProfile(@Param() params: UsernameDto) {
    return this.userService.getUserProfile(params.username);
  }
}

import { Controller, Get, Post, Param, Body } from '@nestjs/common';
import { UserService } from './user.service';
import { BatchSocialDto } from './dto/batch-social.dto';

@Controller('api/user')
export class UserController {
  constructor(private userService: UserService) {}

  @Get('followersAndFollowing/:username')
  async getFollowersAndFollowing(@Param('username') username: string) {
    return this.userService.getFollowersAndFollowing(username);
  }

  @Post('batch-social')
  async batchSocial(@Body() dto: BatchSocialDto) {
    return this.userService.batchFollowersAndFollowing(dto.usernames);
  }
}

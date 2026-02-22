import { Controller, Get, Post, Param, Body } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiBody,
} from '@nestjs/swagger';
import { UserService } from './user.service';
import { BatchSocialDto } from './dto/batch-social.dto';

@ApiTags('User')
@Controller('api/user')
export class UserController {
  constructor(private userService: UserService) {}

  @Get('profile/:username')
  @ApiOperation({ summary: 'Get a user profile by GitHub username' })
  @ApiParam({ name: 'username', description: 'GitHub username' })
  @ApiResponse({
    status: 200,
    description: 'User profile returned successfully',
  })
  @ApiResponse({ status: 404, description: 'User not found' })
  async getUserProfile(@Param('username') username: string) {
    return this.userService.getUserProfile(username);
  }

  @Get('followersAndFollowing/:username')
  @ApiOperation({ summary: 'Get followers and following counts for a user' })
  @ApiParam({ name: 'username', description: 'GitHub username' })
  @ApiResponse({
    status: 200,
    description: 'Followers and following data returned successfully',
  })
  @ApiResponse({ status: 404, description: 'User not found' })
  async getFollowersAndFollowing(@Param('username') username: string) {
    return this.userService.getFollowersAndFollowing(username);
  }

  @Post('batch-social')
  @ApiOperation({
    summary: 'Get followers and following counts for multiple users',
  })
  @ApiBody({
    type: BatchSocialDto,
    description: 'Array of GitHub usernames (max 500)',
  })
  @ApiResponse({
    status: 201,
    description: 'Batch social data returned successfully',
  })
  @ApiResponse({ status: 400, description: 'Validation failed' })
  async batchSocial(@Body() dto: BatchSocialDto) {
    return this.userService.batchFollowersAndFollowing(dto.usernames);
  }
}

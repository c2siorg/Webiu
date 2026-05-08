import { Controller, Get, Post, Param, Body } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiBody,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { UserService } from './user.service';
import { BatchSocialDto } from './dto/batch-social.dto';
// TODO: Import UserDto and BatchSocialDto if available for type property

@ApiTags('User')
@Controller('api/user')
export class UserController {
  constructor(private userService: UserService) {}

  @Get('profile/:username')
  @ApiOperation({ summary: 'Get a user profile by GitHub username' })
  @ApiBearerAuth()
  @ApiParam({ name: 'username', description: 'GitHub username' })
  @ApiResponse({
    status: 200,
    description: 'User profile returned successfully',
    // type: UserDto, // Uncomment and import UserDto if available
  })
  @ApiResponse({ status: 404, description: 'User not found' })
  async getUserProfile(@Param('username') username: string) {
    return this.userService.getUserProfile(username);
  }

  @Get('followersAndFollowing/:username')
  @ApiOperation({ summary: 'Get followers and following counts for a user' })
  @ApiBearerAuth()
  @ApiParam({ name: 'username', description: 'GitHub username' })
  @ApiResponse({
    status: 200,
    description: 'Followers and following data returned successfully',
    // type: Object, // Optionally define a DTO for the response
  })
  @ApiResponse({ status: 404, description: 'User not found' })
  async getFollowersAndFollowing(@Param('username') username: string) {
    return this.userService.getFollowersAndFollowing(username);
  }

  @Post('batch-social')
  @ApiOperation({
    summary: 'Get followers and following counts for multiple users',
  })
  @ApiBearerAuth()
  @ApiBody({
    type: BatchSocialDto,
    description: 'Array of GitHub usernames (max 500)',
  })
  @ApiResponse({
    status: 201,
    description: 'Batch social data returned successfully',
    // type: Object, // Optionally define a DTO for the response
  })
  @ApiResponse({ status: 400, description: 'Validation failed' })
  @Throttle({ default: { ttl: 60_000, limit: 120 } })
  async batchSocial(@Body() dto: BatchSocialDto) {
    return this.userService.batchFollowersAndFollowing(dto.usernames);
  }
}

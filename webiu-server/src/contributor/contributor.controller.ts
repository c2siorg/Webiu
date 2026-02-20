import { Controller, Get, Param, Header } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam, ApiQuery } from '@nestjs/swagger';
import { ContributorService } from './contributor.service';

@ApiTags('Contributors')
@Controller('api/contributor')
export class ContributorController {
  constructor(private contributorService: ContributorService) {}

  @Get('contributors')
  @Header('Cache-Control', 'public, max-age=300')
  @ApiOperation({ summary: 'Get all contributors (paginated)' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number (default: 1)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page (default: 10)' })
  async getAllContributors() {
    return this.contributorService.getAllContributors();
  }

  @Get('issues/:username')
  @Header('Cache-Control', 'public, max-age=300')
  @ApiOperation({ summary: 'Get issues created by a user' })
  @ApiParam({ name: 'username', description: 'GitHub username' })
  async userCreatedIssues(@Param('username') username: string) {
    return this.contributorService.getUserCreatedIssues(username);
  }

  @Get('pull-requests/:username')
  @Header('Cache-Control', 'public, max-age=300')
  @ApiOperation({ summary: 'Get pull requests created by a user' })
  @ApiParam({ name: 'username', description: 'GitHub username' })
  async userCreatedPullRequests(@Param('username') username: string) {
    return this.contributorService.getUserCreatedPullRequests(username);
  }

  @Get('stats/:username')
  @Header('Cache-Control', 'public, max-age=300')
  @ApiOperation({ summary: 'Get combined issue and PR stats for a user' })
  @ApiParam({ name: 'username', description: 'GitHub username' })
  async getUserStats(@Param('username') username: string) {
    return this.contributorService.getUserStats(username);
  }

  @Get('followers/:username')
  @Header('Cache-Control', 'public, max-age=300')
  @ApiOperation({ summary: 'Get followers and following for a user' })
  @ApiParam({ name: 'username', description: 'GitHub username' })
  async getUserFollowersAndFollowing(@Param('username') username: string) {
    return this.contributorService.getUserFollowersAndFollowing(username);
  }
}

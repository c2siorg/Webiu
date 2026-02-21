import { Controller, Get, Param, Header } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam, ApiQuery } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { ContributorService } from './contributor.service';
import { UsernameDto } from './dto/username.dto';

@ApiTags('Contributors')
@Controller('api/contributor')
// All contributor endpoints: stricter limit — each call fans out to GitHub API
@Throttle({ default: { ttl: 60_000, limit: 10 } })
export class ContributorController {
  constructor(private contributorService: ContributorService) {}

  // Most expensive endpoint: fetches contributors for every repo in the org.
  // Tightest limit: 5 requests per IP per minute.
  @Get('contributors')
  @Throttle({ default: { ttl: 60_000, limit: 5 } })
  @Header('Cache-Control', 'public, max-age=300')
  @ApiOperation({ summary: 'Get all contributors (paginated)' })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Page number (default: 1)',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Items per page (default: 10)',
  })
  async getAllContributors() {
    return this.contributorService.getAllContributors();
  }

  @Get('issues/:username')
  @Header('Cache-Control', 'public, max-age=300')
  @ApiOperation({ summary: 'Get issues created by a user' })
  @ApiParam({ name: 'username', description: 'GitHub username' })
  async userCreatedIssues(@Param() params: UsernameDto) {
    return this.contributorService.getUserCreatedIssues(params.username);
  }

  @Get('pull-requests/:username')
  @Header('Cache-Control', 'public, max-age=300')
  @ApiOperation({ summary: 'Get pull requests created by a user' })
  @ApiParam({ name: 'username', description: 'GitHub username' })
  async userCreatedPullRequests(@Param() params: UsernameDto) {
    return this.contributorService.getUserCreatedPullRequests(params.username);
  }

  @Get('stats/:username')
  @Header('Cache-Control', 'public, max-age=300')
  @ApiOperation({ summary: 'Get combined issue and PR stats for a user' })
  @ApiParam({ name: 'username', description: 'GitHub username' })
  async getUserStats(@Param() params: UsernameDto) {
    return this.contributorService.getUserStats(params.username);
  }

  @Get('followers/:username')
  @Header('Cache-Control', 'public, max-age=300')
  @ApiOperation({ summary: 'Get followers and following for a user' })
  @ApiParam({ name: 'username', description: 'GitHub username' })
  async getUserFollowersAndFollowing(@Param() params: UsernameDto) {
    return this.contributorService.getUserFollowersAndFollowing(
      params.username,
    );
  }
}

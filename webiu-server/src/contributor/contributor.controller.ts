import { Controller, Get, Param, Header } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { ContributorService } from './contributor.service';
import { UsernameDto } from './dto/username.dto';

@Controller('api/contributor')
// All contributor endpoints: stricter limit — each call fans out to GitHub API
@Throttle({ default: { ttl: 60_000, limit: 60 } })
export class ContributorController {
  constructor(private contributorService: ContributorService) {}

  // Most expensive endpoint: fetches contributors for every repo in the org.
  // Keep a conservative limit, but not so low that normal page refreshes hit 429.
  @Get('contributors')
  @Throttle({ default: { ttl: 60_000, limit: 120 } })
  @Header('Cache-Control', 'public, max-age=300')
  async getAllContributors() {
    return this.contributorService.getAllContributors();
  }

  @Get('issues/:username')
  @Header('Cache-Control', 'public, max-age=300')
  async userCreatedIssues(@Param() params: UsernameDto) {
    return this.contributorService.getUserCreatedIssues(params.username);
  }

  @Get('pull-requests/:username')
  @Header('Cache-Control', 'public, max-age=300')
  async userCreatedPullRequests(@Param() params: UsernameDto) {
    return this.contributorService.getUserCreatedPullRequests(params.username);
  }

  @Get('stats/:username')
  @Header('Cache-Control', 'public, max-age=300')
  async getUserStats(@Param() params: UsernameDto) {
    return this.contributorService.getUserStats(params.username);
  }

  @Get('followers/:username')
  @Header('Cache-Control', 'public, max-age=300')
  async getUserFollowersAndFollowing(@Param() params: UsernameDto) {
    return this.contributorService.getUserFollowersAndFollowing(
      params.username,
    );
  }
}

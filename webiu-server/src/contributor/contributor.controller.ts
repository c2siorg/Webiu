import { Controller, Get, Param, Header } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { ContributorService } from './contributor.service';

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
  async getAllContributors() {
    return this.contributorService.getAllContributors();
  }

  @Get('issues/:username')
  @Header('Cache-Control', 'public, max-age=300')
  async userCreatedIssues(@Param('username') username: string) {
    return this.contributorService.getUserCreatedIssues(username);
  }

  @Get('pull-requests/:username')
  @Header('Cache-Control', 'public, max-age=300')
  async userCreatedPullRequests(@Param('username') username: string) {
    return this.contributorService.getUserCreatedPullRequests(username);
  }

  @Get('stats/:username')
  @Header('Cache-Control', 'public, max-age=300')
  async getUserStats(@Param('username') username: string) {
    return this.contributorService.getUserStats(username);
  }

  @Get('followers/:username')
  @Header('Cache-Control', 'public, max-age=300')
  async getUserFollowersAndFollowing(@Param('username') username: string) {
    return this.contributorService.getUserFollowersAndFollowing(username);
  }
}

import { Controller, Get, Param, Header, Query } from '@nestjs/common';
import { ContributorService } from './contributor.service';

@Controller('api/contributor')
export class ContributorController {
  constructor(private contributorService: ContributorService) {}

  @Get('contributors')
  @Header('Cache-Control', 'public, max-age=300')
  async getAllContributors(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
  ) {
    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 10;
    return this.contributorService.getAllContributors(pageNum, limitNum);
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

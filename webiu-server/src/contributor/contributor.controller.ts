import { Controller, Get, Param, Header } from '@nestjs/common';
import { ContributorService } from './contributor.service';

@Controller('api/contributor')
export class ContributorController {
  constructor(private contributorService: ContributorService) {}

  @Get('contributors')
  @Header('Cache-Control', 'public, max-age=300')
  async getAllContributors() {
    return this.contributorService.getAllContributors();
  }

  @Get('issues/:username')
  async userCreatedIssues(@Param('username') username: string) {
    return this.contributorService.getUserCreatedIssues(username);
  }

  @Get('pull-requests/:username')
  async userCreatedPullRequests(@Param('username') username: string) {
    return this.contributorService.getUserCreatedPullRequests(username);
  }
}

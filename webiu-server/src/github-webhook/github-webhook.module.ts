import { Module } from '@nestjs/common';
import { GithubWebhookController } from './github-webhook.controller';
import { GithubWebhookService } from './github-webhook.service';
import { ProjectModule } from '../project/project.module';

@Module({
  imports: [ProjectModule],
  controllers: [GithubWebhookController],
  providers: [GithubWebhookService],
})
export class GithubWebhookModule {}

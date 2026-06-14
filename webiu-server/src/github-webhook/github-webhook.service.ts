import { Injectable, Logger } from '@nestjs/common';
import { RepositorySyncService } from '../project/repository-sync.service';

@Injectable()
export class GithubWebhookService {
  private readonly logger = new Logger(GithubWebhookService.name);

  constructor(private readonly repositorySyncService: RepositorySyncService) {}

  async handleWebhookEvent(event: string, payload: any): Promise<void> {
    this.logger.log(`Received GitHub event: ${event}`);

    if (event !== 'repository') {
      this.logger.log(`Ignoring event type: ${event}`);
      return;
    }

    const action = payload.action;
    const repoName = payload.repository?.name;

    if (!repoName) {
      this.logger.warn('Webhook payload is missing repository name.');
      return;
    }

    this.logger.log(
      `Processing repository event. Action: ${action}, Repository: ${repoName}`,
    );

    switch (action) {
      case 'created':
      case 'edited':
      case 'renamed':
      case 'unarchived':
        await this.repositorySyncService.syncSingleRepository(repoName);
        break;
      case 'deleted':
      case 'archived':
        await this.repositorySyncService.deleteRepository(repoName);
        break;
      default:
        this.logger.log(`Ignoring repository action: ${action}`);
        break;
    }
  }
}

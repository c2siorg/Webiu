import { Injectable, OnApplicationBootstrap, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GithubService } from '../github/github.service';
import { Repository as RepositoryEntity } from '../database/entities/repository.entity';

@Injectable()
export class RepositorySyncService implements OnApplicationBootstrap {
  private readonly logger = new Logger(RepositorySyncService.name);

  constructor(
    @InjectRepository(RepositoryEntity)
    private readonly repoRepository: Repository<RepositoryEntity>,
    private readonly githubService: GithubService,
  ) {}

  async onApplicationBootstrap() {
    this.logger.log(
      'Checking if initial repository synchronization is required...',
    );
    const count = await this.repoRepository.count();

    if (count === 0) {
      this.logger.log(
        'No repositories found in database. Running initial sync...',
      );
      try {
        await this.syncRepositories('bootstrap');
        this.logger.log(
          'Initial repository synchronization completed successfully.',
        );
      } catch (error) {
        this.logger.error(
          'Failed to run initial repository sync:',
          error.message,
        );
      }
    } else {
      this.logger.log('Repositories already exist in database.');
    }
  }

  async saveRepositoryData(
    repo: RepositoryEntity,
    gitRepo: any,
    source: string,
  ): Promise<RepositoryEntity> {
    repo.name = gitRepo.name;
    repo.description = gitRepo.description;
    repo.homepage = gitRepo.homepage;
    repo.topics = gitRepo.topics || [];
    repo.stars = gitRepo.stargazers_count;
    repo.forks = gitRepo.forks_count;
    repo.lastSyncedAt = new Date();
    repo.isActive = !gitRepo.archived;
    repo.syncStatus = 'success';
    repo.syncError = null;
    repo.reconciliationSource = source;

    return this.repoRepository.save(repo);
  }

  async syncRepositories(source: string = 'manual'): Promise<void> {
    this.logger.log('Starting repository synchronization with GitHub...');
    const githubRepos = await this.githubService.getAllOrgReposSorted();

    for (const gitRepo of githubRepos) {
      const githubRepoId = String(gitRepo.id);

      let repo = await this.repoRepository.findOne({
        where: { githubRepoId },
      });

      if (!repo) {
        repo = this.repoRepository.create({ githubRepoId });
      }

      await this.saveRepositoryData(repo, gitRepo, source);
    }

    this.logger.log(`Synchronized ${githubRepos.length} repositories.`);
  }

  async syncSingleRepository(
    repoName: string,
    source: string = 'webhook',
  ): Promise<void> {
    this.logger.log(`Starting synchronization for repository: ${repoName}`);
    try {
      const gitRepo = await this.githubService.getRepo(repoName);
      if (!gitRepo) {
        this.logger.warn(
          `Repository ${repoName} not found on GitHub. Deleting from local DB if exists.`,
        );
        await this.deleteRepository(repoName, source);
        return;
      }

      const githubRepoId = String(gitRepo.id);
      let repo = await this.repoRepository.findOne({
        where: { githubRepoId },
      });

      if (!repo) {
        repo = this.repoRepository.create({ githubRepoId });
      }

      await this.saveRepositoryData(repo, gitRepo, source);
      this.logger.log(`Synchronized repository ${repoName} successfully.`);
    } catch (error) {
      this.logger.error(
        `Failed to sync repository ${repoName}:`,
        error.message,
      );
      const repo = await this.repoRepository.findOne({
        where: { name: repoName },
      });
      if (repo) {
        repo.syncStatus = 'failed';
        repo.syncError = error.message;
        repo.reconciliationSource = source;
        await this.repoRepository.save(repo);
      }
      throw error;
    }
  }

  async deleteRepository(
    repoName: string,
    source: string = 'webhook',
  ): Promise<void> {
    this.logger.log(`Soft-deleting (marking inactive) repository: ${repoName}`);
    const repo = await this.repoRepository.findOne({
      where: { name: repoName },
    });
    if (repo) {
      repo.isActive = false;
      repo.syncStatus = 'success';
      repo.syncError = null;
      repo.reconciliationSource = source;
      repo.lastSyncedAt = new Date();
      await this.repoRepository.save(repo);
      this.logger.log(`Marked repository ${repoName} as inactive.`);
    } else {
      this.logger.log(
        `Repository ${repoName} not found in database for deactivation.`,
      );
    }
  }
}

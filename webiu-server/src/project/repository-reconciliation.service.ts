import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cron } from '@nestjs/schedule';
import { GithubService } from '../github/github.service';
import { RepositorySyncService } from './repository-sync.service';
import { Repository as RepositoryEntity } from '../database/entities/repository.entity';

@Injectable()
export class RepositoryReconciliationService {
  private readonly logger = new Logger(RepositoryReconciliationService.name);

  constructor(
    @InjectRepository(RepositoryEntity)
    private readonly repoRepository: Repository<RepositoryEntity>,
    private readonly githubService: GithubService,
    private readonly repositorySyncService: RepositorySyncService,
  ) {}

  @Cron('0 */12 * * *')
  async reconcileRepositories(): Promise<void> {
    this.logger.log('Starting repository reconciliation cron job...');

    try {
      // 1. Fetch all repositories from GitHub
      const githubRepos = await this.githubService.getAllOrgReposSorted();
      const githubRepoMap = new Map(
        githubRepos.map((repo) => [String(repo.id), repo]),
      );

      // 2. Fetch all repositories from database
      const dbRepos = await this.repoRepository.find();
      const dbRepoMap = new Map(
        dbRepos.map((repo) => [repo.githubRepoId, repo]),
      );

      // 3. Reconcile GitHub -> Database (drift detection & missing repositories)
      for (const [gitId, gitRepo] of githubRepoMap.entries()) {
        try {
          let dbRepo = dbRepoMap.get(gitId);
          let isDrifted = false;

          if (!dbRepo) {
            // Missing repository
            this.logger.log(
              `Reconciliation: Repository ${gitRepo.name} is missing locally. Creating record...`,
            );
            dbRepo = this.repoRepository.create({ githubRepoId: gitId });
            isDrifted = true;
          }

          // Check for drift
          const gitTopics = gitRepo.topics || [];
          const dbTopics = dbRepo.topics || [];
          const sortedGitTopics = [...gitTopics].sort().join(',');
          const sortedDbTopics = [...dbTopics].sort().join(',');
          const expectedActive = !gitRepo.archived;
          const expectedVisibility = gitRepo.private ? 'private' : 'public';
          const expectedIsArchived = gitRepo.archived || false;
          const expectedLanguage = gitRepo.language || null;

          if (
            dbRepo.name !== gitRepo.name ||
            dbRepo.description !== gitRepo.description ||
            dbRepo.homepage !== gitRepo.homepage ||
            sortedDbTopics !== sortedGitTopics ||
            dbRepo.stars !== gitRepo.stargazers_count ||
            dbRepo.forks !== gitRepo.forks_count ||
            dbRepo.isActive !== expectedActive ||
            dbRepo.visibility !== expectedVisibility ||
            dbRepo.isArchived !== expectedIsArchived ||
            dbRepo.language !== expectedLanguage
          ) {
            isDrifted = true;
          }

          if (isDrifted) {
            this.logger.log(
              `Reconciliation: Drift detected or repository is new for ${gitRepo.name}. Updating...`,
            );
            await this.repositorySyncService.saveRepositoryData(
              dbRepo,
              gitRepo,
              'cron',
            );
          }
        } catch (error) {
          this.logger.error(
            `Reconciliation failed for repository ${gitRepo.name}:`,
            error.message,
          );
          const dbRepo = dbRepoMap.get(gitId);
          if (dbRepo) {
            dbRepo.syncStatus = 'failed';
            dbRepo.syncError = error.message;
            dbRepo.reconciliationSource = 'cron';
            await this.repoRepository.save(dbRepo);
          }
        }
      }

      // 4. Reconcile Database -> GitHub (deleted repositories detection)
      for (const [dbId, dbRepo] of dbRepoMap.entries()) {
        if (!dbRepo.isActive) continue;

        if (!githubRepoMap.has(dbId)) {
          this.logger.log(
            `Reconciliation: Repository ${dbRepo.name} no longer exists on GitHub. Marking inactive...`,
          );
          dbRepo.isActive = false;
          dbRepo.syncStatus = 'success';
          dbRepo.syncError = null;
          dbRepo.reconciliationSource = 'cron';
          dbRepo.lastSyncedAt = new Date();
          dbRepo.lastReconciliationAt = new Date();

          await this.repoRepository.save(dbRepo);
        }
      }

      this.logger.log('Repository reconciliation completed successfully.');
    } catch (error) {
      this.logger.error(
        'Global repository reconciliation failure:',
        error.message,
      );
    }
  }
}

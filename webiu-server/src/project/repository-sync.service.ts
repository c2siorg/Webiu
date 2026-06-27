import { Injectable, OnApplicationBootstrap, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, Not } from 'typeorm';
import { GithubService } from '../github/github.service';
import { Repository as RepositoryEntity } from '../database/entities/repository.entity';
import { Contributor } from '../database/entities/contributor.entity';
import { RepositoryContributor } from '../database/entities/repository-contributor.entity';

@Injectable()
export class RepositorySyncService implements OnApplicationBootstrap {
  private readonly logger = new Logger(RepositorySyncService.name);

  constructor(
    @InjectRepository(RepositoryEntity)
    private readonly repoRepository: Repository<RepositoryEntity>,
    @InjectRepository(Contributor)
    private readonly contributorRepository: Repository<Contributor>,
    @InjectRepository(RepositoryContributor)
    private readonly repoContributorRepository: Repository<RepositoryContributor>,
    private readonly githubService: GithubService,
  ) {}

  private async runLocked<T>(
    repoName: string,
    fn: () => Promise<T>,
  ): Promise<T> {
    const lockId = this.getLockId(repoName);
    if (
      !this.repoRepository.manager ||
      !this.repoRepository.manager.connection
    ) {
      return await fn();
    }
    const queryRunner =
      this.repoRepository.manager.connection.createQueryRunner();
    await queryRunner.connect();

    try {
      this.logger.log(
        `Acquiring database advisory lock for repository: ${repoName} (ID: ${lockId})`,
      );
      await queryRunner.query('SELECT pg_advisory_lock($1)', [lockId]);
      this.logger.log(`Advisory lock acquired for repository: ${repoName}`);

      return await fn();
    } finally {
      try {
        await queryRunner.query('SELECT pg_advisory_unlock($1)', [lockId]);
        this.logger.log(`Advisory lock released for repository: ${repoName}`);
      } catch (err) {
        this.logger.error(
          `Failed to release advisory lock for repository ${repoName}:`,
          err.message,
        );
      } finally {
        await queryRunner.release();
      }
    }
  }

  private getLockId(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = (hash << 5) - hash + str.charCodeAt(i);
      hash |= 0; // Convert to 32bit integer
    }
    return Math.abs(hash);
  }

  async onApplicationBootstrap() {
    this.logger.log(
      'Checking if initial repository synchronization is required...',
    );
    const count = await this.repoRepository.count();

    if (count === 0) {
      this.logger.log(
        'No repositories found in database. Running initial sync in the background...',
      );
      this.syncRepositories('bootstrap')
        .then(() => {
          this.logger.log(
            'Initial repository synchronization completed successfully.',
          );
        })
        .catch((error) => {
          this.logger.error(
            'Failed to run initial repository sync:',
            error.message,
          );
        });
    } else {
      this.logger.log('Repositories already exist in database.');
    }
  }

  async saveRepositoryDataInternal(
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

    if (source === 'webhook') {
      repo.lastWebhookAt = new Date();
    } else if (source === 'cron') {
      repo.lastReconciliationAt = new Date();
    }

    const savedRepo = await this.repoRepository.save(repo);
    await this.syncContributorsForRepository(savedRepo);
    return savedRepo;
  }

  async saveRepositoryData(
    repo: RepositoryEntity,
    gitRepo: any,
    source: string,
  ): Promise<RepositoryEntity> {
    return this.runLocked(gitRepo.name, async () => {
      return this.saveRepositoryDataInternal(repo, gitRepo, source);
    });
  }

  async syncContributorsForRepository(repo: RepositoryEntity): Promise<void> {
    this.logger.log(`Syncing contributors for repository ${repo.name}...`);
    try {
      const gitContributors = await this.githubService.getRepoContributors(
        this.githubService.org,
        repo.name,
      );

      if (!gitContributors) {
        this.logger.warn(
          `No contributors returned for repository ${repo.name}`,
        );
        return;
      }

      const activeContributorIds: string[] = [];

      for (const gitContributor of gitContributors) {
        if (!gitContributor.id) continue;

        const githubUserId = String(gitContributor.id);
        const username = gitContributor.login;
        const avatarUrl = gitContributor.avatar_url;
        const profileUrl =
          gitContributor.html_url || `https://github.com/${username}`;

        let contributor = await this.contributorRepository.findOne({
          where: { githubUserId },
        });

        if (!contributor) {
          contributor = this.contributorRepository.create({
            githubUserId,
            username,
            avatarUrl,
            profileUrl,
          });

          // Fetch detailed profile for new contributors to populate bio and displayName
          try {
            const profile =
              await this.githubService.getPublicUserProfile(username);
            contributor.displayName = profile.name || null;
            contributor.bio = profile.bio || null;
          } catch (err) {
            this.logger.warn(
              `Failed to fetch public profile for new contributor ${username}: ${err.message}`,
            );
          }
        } else {
          // Update basic metadata for existing contributors
          contributor.username = username;
          contributor.avatarUrl = avatarUrl;
          contributor.profileUrl = profileUrl;
        }

        const savedContributor =
          await this.contributorRepository.save(contributor);
        activeContributorIds.push(savedContributor.id);

        // Upsert repository-contributor relation
        let repoContributor = await this.repoContributorRepository.findOne({
          where: {
            repositoryId: repo.id,
            contributorId: savedContributor.id,
          },
        });

        if (!repoContributor) {
          repoContributor = this.repoContributorRepository.create({
            repositoryId: repo.id,
            contributorId: savedContributor.id,
          });
        }

        repoContributor.contributionCount = gitContributor.contributions || 0;
        await this.repoContributorRepository.save(repoContributor);
      }

      // Clean up drift (removed contributor relationships)
      if (activeContributorIds.length > 0) {
        await this.repoContributorRepository.delete({
          repositoryId: repo.id,
          contributorId: Not(In(activeContributorIds)),
        });
      } else {
        await this.repoContributorRepository.delete({
          repositoryId: repo.id,
        });
      }
      this.logger.log(
        `Successfully synced ${activeContributorIds.length} contributors for repo ${repo.name}.`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to sync contributors for repository ${repo.name}:`,
        error.message,
      );
    }
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

      await this.runLocked(repoName, async () => {
        const githubRepoId = String(gitRepo.id);
        let repo = await this.repoRepository.findOne({
          where: { githubRepoId },
        });

        if (!repo) {
          repo = this.repoRepository.create({ githubRepoId });
        }

        await this.saveRepositoryDataInternal(repo, gitRepo, source);
      });
      this.logger.log(`Synchronized repository ${repoName} successfully.`);
    } catch (error) {
      this.logger.error(
        `Failed to sync repository ${repoName}:`,
        error.message,
      );
      try {
        await this.runLocked(repoName, async () => {
          const repo = await this.repoRepository.findOne({
            where: { name: repoName },
          });
          if (repo) {
            repo.syncStatus = 'failed';
            repo.syncError = error.message;
            repo.reconciliationSource = source;
            await this.repoRepository.save(repo);
          }
        });
      } catch (logErr) {
        this.logger.error(
          `Failed to log sync error for ${repoName}:`,
          logErr.message,
        );
      }
      throw error;
    }
  }

  async deleteRepository(
    repoName: string,
    source: string = 'webhook',
  ): Promise<void> {
    await this.runLocked(repoName, async () => {
      this.logger.log(
        `Soft-deleting (marking inactive) repository: ${repoName}`,
      );
      const repo = await this.repoRepository.findOne({
        where: { name: repoName },
      });
      if (repo) {
        repo.isActive = false;
        repo.syncStatus = 'success';
        repo.syncError = null;
        repo.reconciliationSource = source;
        repo.lastSyncedAt = new Date();

        if (source === 'webhook') {
          repo.lastWebhookAt = new Date();
        } else if (source === 'cron') {
          repo.lastReconciliationAt = new Date();
        }

        await this.repoRepository.save(repo);
        this.logger.log(`Marked repository ${repoName} as inactive.`);
      } else {
        this.logger.log(
          `Repository ${repoName} not found in database for deactivation.`,
        );
      }
    });
  }
}

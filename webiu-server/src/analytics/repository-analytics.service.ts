import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository as TypeOrmRepository } from 'typeorm';
import { Contributor } from '../database/entities/contributor.entity';
import { Repository as RepositoryEntity } from '../database/entities/repository.entity';
import { RepositoryContributor } from '../database/entities/repository-contributor.entity';

@Injectable()
export class RepositoryAnalyticsService {
  private readonly logger = new Logger(RepositoryAnalyticsService.name);

  constructor(
    @InjectRepository(Contributor)
    private readonly contributorRepository: TypeOrmRepository<Contributor>,
    @InjectRepository(RepositoryEntity)
    private readonly repoRepository: TypeOrmRepository<RepositoryEntity>,
    @InjectRepository(RepositoryContributor)
    private readonly repoContributorRepository: TypeOrmRepository<RepositoryContributor>,
  ) {}

  async getRepositoryAnalytics() {
    try {
      // 1. Core metric counts
      const [
        totalRepositories,
        publicRepositories,
        privateRepositories,
        archivedRepositories,
        totalContributors,
      ] = await Promise.all([
        this.repoRepository.count(),
        this.repoRepository.count({ where: { visibility: 'public' } }),
        this.repoRepository.count({ where: { visibility: 'private' } }),
        this.repoRepository.count({ where: { isArchived: true } }),
        this.contributorRepository.count(),
      ]);

      // 2. Stars and Forks SUM
      const totalsResult = await this.repoRepository
        .createQueryBuilder('repo')
        .select('SUM(repo.stars)', 'totalStars')
        .addSelect('SUM(repo.forks)', 'totalForks')
        .getRawOne();

      const totalStars = parseInt(totalsResult?.totalStars || '0', 10);
      const totalForks = parseInt(totalsResult?.totalForks || '0', 10);

      // 3. Connections count for averages
      const totalConnectionsResult = await this.repoContributorRepository
        .createQueryBuilder('rc')
        .select('COUNT(rc.contributorId)', 'count')
        .getRawOne();
      const totalConnections = parseInt(
        totalConnectionsResult?.count || '0',
        10,
      );

      const averageContributorsPerRepo =
        totalRepositories > 0
          ? Number((totalConnections / totalRepositories).toFixed(2))
          : 0;

      const averageStarsPerRepo =
        totalRepositories > 0
          ? Number((totalStars / totalRepositories).toFixed(2))
          : 0;

      const averageForksPerRepo =
        totalRepositories > 0
          ? Number((totalForks / totalRepositories).toFixed(2))
          : 0;

      // 4. Fetch all repositories with their contributor count for listings/distributions
      const reposRaw = await this.repoRepository
        .createQueryBuilder('repo')
        .leftJoin('repo.repositoryContributors', 'rc')
        .select([
          'repo.id as id',
          'repo.name as name',
          'repo.description as description',
          'repo.stars as stars',
          'repo.forks as forks',
          'repo.topics as topics',
          'repo.visibility as visibility',
          'repo.isArchived as "isArchived"',
          'repo.language as language',
          'COUNT(rc.contributorId) as "contributorCount"',
        ])
        .groupBy('repo.id')
        .orderBy('repo.name', 'ASC')
        .getRawMany();

      const allRepositories = reposRaw.map((r) => {
        let parsedTopics: string[] = [];
        if (r.topics) {
          parsedTopics =
            typeof r.topics === 'string' ? r.topics.split(',') : r.topics;
        }
        return {
          id: r.id,
          name: r.name,
          description: r.description || null,
          stars: parseInt(r.stars || '0', 10),
          forks: parseInt(r.forks || '0', 10),
          visibility: r.visibility,
          isArchived:
            r.isArchived === true ||
            r.isArchived === 'true' ||
            r.isArchived === 1,
          language: r.language || null,
          topics: parsedTopics,
          contributorCount: parseInt(r.contributorCount || '0', 10),
        };
      });

      // 5. Popular repositories (ranked by stars DESC)
      const popularRepositories = [...allRepositories]
        .sort((a, b) => b.stars - a.stars)
        .slice(0, 10);

      // 6. Community participation (top community projects by contributor count)
      const repositoryParticipation = [...allRepositories]
        .sort((a, b) => b.contributorCount - a.contributorCount)
        .map((r) => ({
          name: r.name,
          contributorCount: r.contributorCount,
        }));

      // 7. Fork distribution
      const forkDistribution = [...allRepositories]
        .sort((a, b) => b.forks - a.forks)
        .map((r) => ({
          name: r.name,
          forks: r.forks,
        }));

      // 8. Topic distribution
      const topicCounts: Record<string, number> = {};
      allRepositories.forEach((repo) => {
        if (repo.topics) {
          repo.topics.forEach((topic) => {
            const cleanTopic = topic.trim();
            if (cleanTopic) {
              topicCounts[cleanTopic] = (topicCounts[cleanTopic] || 0) + 1;
            }
          });
        }
      });
      const topicDistribution = Object.entries(topicCounts)
        .map(([topic, count]) => ({ topic, count }))
        .sort((a, b) => b.count - a.count);

      // 9. Language distribution
      const languageCounts: Record<string, number> = {};
      allRepositories.forEach((repo) => {
        if (repo.language) {
          const cleanLanguage = repo.language.trim();
          if (cleanLanguage) {
            languageCounts[cleanLanguage] =
              (languageCounts[cleanLanguage] || 0) + 1;
          }
        }
      });
      const languageDistribution = Object.entries(languageCounts)
        .map(([language, count]) => ({ language, count }))
        .sort((a, b) => b.count - a.count);

      // 10. Health insights
      const mostStarredRepo =
        allRepositories.length > 0
          ? allRepositories.reduce((prev, current) =>
              prev.stars > current.stars ? prev : current,
            )
          : null;

      const mostForkedRepo =
        allRepositories.length > 0
          ? allRepositories.reduce((prev, current) =>
              prev.forks > current.forks ? prev : current,
            )
          : null;

      const largestCommunityRepo =
        allRepositories.length > 0
          ? allRepositories.reduce((prev, current) =>
              prev.contributorCount > current.contributorCount ? prev : current,
            )
          : null;

      const activeRepos = allRepositories.filter((r) => !r.isArchived);
      const leastActiveRepo =
        activeRepos.length > 0
          ? activeRepos.reduce((prev, current) =>
              prev.contributorCount < current.contributorCount ? prev : current,
            )
          : allRepositories.length > 0
            ? allRepositories.reduce((prev, current) =>
                prev.contributorCount < current.contributorCount
                  ? prev
                  : current,
              )
            : null;

      const communityInsights = {
        mostStarredRepo: mostStarredRepo
          ? { name: mostStarredRepo.name, stars: mostStarredRepo.stars }
          : null,
        mostForkedRepo: mostForkedRepo
          ? { name: mostForkedRepo.name, forks: mostForkedRepo.forks }
          : null,
        largestCommunityRepo: largestCommunityRepo
          ? {
              name: largestCommunityRepo.name,
              contributorCount: largestCommunityRepo.contributorCount,
            }
          : null,
        leastActiveRepo: leastActiveRepo
          ? {
              name: leastActiveRepo.name,
              contributorCount: leastActiveRepo.contributorCount,
            }
          : null,
        archivedRepoCount: archivedRepositories,
      };

      return {
        metrics: {
          totalRepositories,
          publicRepositories,
          privateRepositories,
          archivedRepositories,
          totalContributors,
          totalStars,
          totalForks,
          averageContributorsPerRepo,
          averageStarsPerRepo,
          averageForksPerRepo,
        },
        popularRepositories,
        repositoryParticipation,
        forkDistribution,
        topicDistribution,
        languageDistribution,
        visibilityDistribution: {
          public: publicRepositories,
          private: privateRepositories,
          archived: archivedRepositories,
        },
        communityInsights,
        explorer: allRepositories,
      };
    } catch (error) {
      this.logger.error(
        'Error generating repository analytics:',
        error.message,
      );
      throw error;
    }
  }
}

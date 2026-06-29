import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository as TypeOrmRepository } from 'typeorm';
import { Contributor } from '../database/entities/contributor.entity';
import { Repository as RepositoryEntity } from '../database/entities/repository.entity';
import { RepositoryContributor } from '../database/entities/repository-contributor.entity';

@Injectable()
export class ContributorAnalyticsService {
  private readonly logger = new Logger(ContributorAnalyticsService.name);

  constructor(
    @InjectRepository(Contributor)
    private readonly contributorRepository: TypeOrmRepository<Contributor>,
    @InjectRepository(RepositoryEntity)
    private readonly repoRepository: TypeOrmRepository<RepositoryEntity>,
    @InjectRepository(RepositoryContributor)
    private readonly repoContributorRepository: TypeOrmRepository<RepositoryContributor>,
  ) {}

  async getContributorAnalytics() {
    try {
      // 1. Fetch count metrics
      const [totalContributors, activeRepositories] = await Promise.all([
        this.contributorRepository.count(),
        this.repoRepository.count({ where: { isActive: true } }),
      ]);

      // 2. Fetch connections & contributions totals
      const [totalConnectionsResult, totalContributionsSumResult] =
        await Promise.all([
          this.repoContributorRepository
            .createQueryBuilder('rc')
            .innerJoin('rc.repository', 'repo')
            .where('repo.isActive = :isActive', { isActive: true })
            .select('COUNT(rc.contributorId)', 'count')
            .getRawOne(),
          this.repoContributorRepository
            .createQueryBuilder('rc')
            .innerJoin('rc.repository', 'repo')
            .where('repo.isActive = :isActive', { isActive: true })
            .select('SUM(rc.contributionCount)', 'sum')
            .getRawOne(),
        ]);

      const totalConnections = parseInt(
        totalConnectionsResult?.count || '0',
        10,
      );
      const totalContributionsSum = parseInt(
        totalContributionsSumResult?.sum || '0',
        10,
      );

      const averageContributorsPerRepo =
        activeRepositories > 0
          ? Number((totalConnections / activeRepositories).toFixed(2))
          : 0;
      const averageContributionsPerContributor =
        totalContributors > 0
          ? Number((totalContributionsSum / totalContributors).toFixed(2))
          : 0;

      // 3. Top contributor contribution count
      const topContributorResult = await this.repoContributorRepository
        .createQueryBuilder('rc')
        .innerJoin('rc.repository', 'repo')
        .select('SUM(rc.contributionCount)', 'totalContributions')
        .where('repo.isActive = :isActive', { isActive: true })
        .groupBy('rc.contributorId')
        .orderBy('SUM(rc.contributionCount)', 'DESC')
        .limit(1)
        .getRawOne();
      const topContributorContributionCount = parseInt(
        topContributorResult?.totalContributions || '0',
        10,
      );

      // 4. Largest Repository Community
      const largestCommunityResult = await this.repoContributorRepository
        .createQueryBuilder('rc')
        .innerJoin('rc.repository', 'repo')
        .select('COUNT(rc.contributorId)', 'contributorCount')
        .where('repo.isActive = :isActive', { isActive: true })
        .groupBy('rc.repositoryId')
        .orderBy('COUNT(rc.contributorId)', 'DESC')
        .limit(1)
        .getRawOne();
      const largestRepositoryCommunity = parseInt(
        largestCommunityResult?.contributorCount || '0',
        10,
      );

      // 5. Leaderboard (Top 10 contributors by contribution count)
      const leaderboardRaw = await this.repoContributorRepository
        .createQueryBuilder('rc')
        .innerJoin('rc.repository', 'repo')
        .innerJoin('rc.contributor', 'c')
        .select([
          'c.id as id',
          'c.username as username',
          'c.avatarUrl as "avatarUrl"',
          'c.profileUrl as "profileUrl"',
          'SUM(rc.contributionCount) as "totalContributions"',
          'COUNT(DISTINCT repo.id) as "repoCount"',
        ])
        .where('repo.isActive = :isActive', { isActive: true })
        .groupBy('c.id')
        .addGroupBy('c.username')
        .addGroupBy('c.avatarUrl')
        .addGroupBy('c.profileUrl')
        .orderBy('SUM(rc.contributionCount)', 'DESC')
        .limit(10)
        .getRawMany();

      const leaderboard = [];
      if (leaderboardRaw.length > 0) {
        const ids = leaderboardRaw.map((l) => l.id);
        const relations = await this.repoContributorRepository
          .createQueryBuilder('rc')
          .innerJoinAndSelect('rc.repository', 'repo')
          .where(
            'rc.contributorId IN (:...ids) AND repo.isActive = :isActive',
            { ids, isActive: true },
          )
          .getMany();

        for (const row of leaderboardRaw) {
          const contributorRepos = relations
            .filter((r) => r.contributorId === row.id)
            .map((r) => r.repository.name);
          leaderboard.push({
            id: row.id,
            username: row.username,
            avatarUrl: row.avatarUrl,
            profileUrl: row.profileUrl,
            totalContributions: parseInt(row.totalContributions || '0', 10),
            repoCount: parseInt(row.repoCount || '0', 10),
            repos: contributorRepos,
          });
        }
      }

      // 6. Repository Participation (active repos and their contributor counts)
      const repoParticipationRaw = await this.repoRepository
        .createQueryBuilder('repo')
        .leftJoin('repo.repositoryContributors', 'rc')
        .select([
          'repo.id as id',
          'repo.name as name',
          'COUNT(rc.contributorId) as "contributorCount"',
        ])
        .where('repo.isActive = :isActive', { isActive: true })
        .groupBy('repo.id')
        .orderBy('COUNT(rc.contributorId)', 'DESC')
        .getRawMany();

      const repositoryParticipation = repoParticipationRaw.map((r) => ({
        id: r.id,
        name: r.name,
        contributorCount: parseInt(r.contributorCount || '0', 10),
      }));

      // 7. Contribution Distribution Buckets
      const distributionRaw = await this.repoContributorRepository
        .createQueryBuilder('rc')
        .innerJoin('rc.repository', 'repo')
        .select('rc.contributorId', 'contributorId')
        .addSelect('SUM(rc.contributionCount)', 'totalContributions')
        .where('repo.isActive = :isActive', { isActive: true })
        .groupBy('rc.contributorId')
        .getRawMany();

      const distributionBuckets = {
        '1-10': 0,
        '11-50': 0,
        '51-100': 0,
        '100+': 0,
      };

      for (const row of distributionRaw) {
        const total = parseInt(row.totalContributions || '0', 10);
        if (total >= 1 && total <= 10) distributionBuckets['1-10']++;
        else if (total >= 11 && total <= 50) distributionBuckets['11-50']++;
        else if (total >= 51 && total <= 100) distributionBuckets['51-100']++;
        else if (total > 100) distributionBuckets['100+']++;
      }

      // 8. Community Insights
      const [mostActiveRaw, largestCommunityRaw, highestAvgRaw, crossRepoRaw] =
        await Promise.all([
          this.repoContributorRepository
            .createQueryBuilder('rc')
            .innerJoin('rc.repository', 'repo')
            .innerJoin('rc.contributor', 'c')
            .select([
              'c.username as username',
              'c.avatarUrl as "avatarUrl"',
              'c.profileUrl as "profileUrl"',
              'SUM(rc.contributionCount) as "totalContributions"',
              'COUNT(DISTINCT repo.id) as "repoCount"',
            ])
            .where('repo.isActive = :isActive', { isActive: true })
            .groupBy('c.id')
            .addGroupBy('c.username')
            .addGroupBy('c.avatarUrl')
            .addGroupBy('c.profileUrl')
            .orderBy('SUM(rc.contributionCount)', 'DESC')
            .limit(1)
            .getRawOne(),
          this.repoRepository
            .createQueryBuilder('repo')
            .leftJoin('repo.repositoryContributors', 'rc')
            .select([
              'repo.name as name',
              'COUNT(rc.contributorId) as "contributorCount"',
            ])
            .where('repo.isActive = :isActive', { isActive: true })
            .groupBy('repo.id')
            .orderBy('COUNT(rc.contributorId)', 'DESC')
            .limit(1)
            .getRawOne(),
          this.repoRepository
            .createQueryBuilder('repo')
            .innerJoin('repo.repositoryContributors', 'rc')
            .select([
              'repo.name as name',
              'AVG(rc.contributionCount) as "avgContributions"',
            ])
            .where('repo.isActive = :isActive', { isActive: true })
            .groupBy('repo.id')
            .orderBy('AVG(rc.contributionCount)', 'DESC')
            .limit(1)
            .getRawOne(),
          this.repoContributorRepository
            .createQueryBuilder('rc')
            .innerJoin('rc.repository', 'repo')
            .innerJoin('rc.contributor', 'c')
            .select([
              'c.username as username',
              'c.avatarUrl as "avatarUrl"',
              'c.profileUrl as "profileUrl"',
              'COUNT(DISTINCT repo.id) as "repoCount"',
              'SUM(rc.contributionCount) as "totalContributions"',
            ])
            .where('repo.isActive = :isActive', { isActive: true })
            .groupBy('c.id')
            .addGroupBy('c.username')
            .addGroupBy('c.avatarUrl')
            .addGroupBy('c.profileUrl')
            .orderBy('COUNT(DISTINCT repo.id)', 'DESC')
            .addOrderBy('SUM(rc.contributionCount)', 'DESC')
            .limit(1)
            .getRawOne(),
        ]);

      const communityInsights = {
        mostActiveContributor: mostActiveRaw
          ? {
              username: mostActiveRaw.username,
              avatarUrl: mostActiveRaw.avatarUrl,
              profileUrl: mostActiveRaw.profileUrl,
              totalContributions: parseInt(
                mostActiveRaw.totalContributions || '0',
                10,
              ),
              repoCount: parseInt(mostActiveRaw.repoCount || '0', 10),
            }
          : null,
        largestCommunityRepo: largestCommunityRaw
          ? {
              name: largestCommunityRaw.name,
              contributorCount: parseInt(
                largestCommunityRaw.contributorCount || '0',
                10,
              ),
            }
          : null,
        highestAverageContributionsRepo: highestAvgRaw
          ? {
              name: highestAvgRaw.name,
              avgContributions: Number(
                parseFloat(highestAvgRaw.avgContributions || '0').toFixed(2),
              ),
            }
          : null,
        crossRepoContributor: crossRepoRaw
          ? {
              username: crossRepoRaw.username,
              avatarUrl: crossRepoRaw.avatarUrl,
              profileUrl: crossRepoRaw.profileUrl,
              repoCount: parseInt(crossRepoRaw.repoCount || '0', 10),
              totalContributions: parseInt(
                crossRepoRaw.totalContributions || '0',
                10,
              ),
            }
          : null,
      };

      // 9. Explorer List (all contributors with repo counts and names)
      const explorerRaw = await this.repoContributorRepository
        .createQueryBuilder('rc')
        .innerJoin('rc.repository', 'repo')
        .innerJoin('rc.contributor', 'c')
        .select([
          'c.id as id',
          'c.username as username',
          'c.avatarUrl as "avatarUrl"',
          'c.profileUrl as "profileUrl"',
          'SUM(rc.contributionCount) as "totalContributions"',
          'COUNT(DISTINCT repo.id) as "repoCount"',
        ])
        .where('repo.isActive = :isActive', { isActive: true })
        .groupBy('c.id')
        .addGroupBy('c.username')
        .addGroupBy('c.avatarUrl')
        .addGroupBy('c.profileUrl')
        .orderBy('c.username', 'ASC')
        .getRawMany();

      const explorer = [];
      if (explorerRaw.length > 0) {
        const rcMapping = await this.repoContributorRepository
          .createQueryBuilder('rc')
          .innerJoin('rc.repository', 'repo')
          .select([
            'rc.contributorId as "contributorId"',
            'repo.name as "repoName"',
          ])
          .where('repo.isActive = :isActive', { isActive: true })
          .getRawMany();

        for (const row of explorerRaw) {
          const contributorRepos = rcMapping
            .filter((m) => m.contributorId === row.id)
            .map((m) => m.repoName);
          explorer.push({
            id: row.id,
            username: row.username,
            avatarUrl: row.avatarUrl,
            profileUrl: row.profileUrl,
            totalContributions: parseInt(row.totalContributions || '0', 10),
            repoCount: parseInt(row.repoCount || '0', 10),
            repos: contributorRepos,
          });
        }
      }

      // 10. Recent Contributors
      const recentContributorsRaw = await this.contributorRepository.find({
        order: { createdAt: 'DESC' },
        take: 10,
      });

      const recentContributors = recentContributorsRaw.map((c) => ({
        id: c.id,
        username: c.username,
        avatarUrl: c.avatarUrl,
        profileUrl: c.profileUrl,
        createdAt: c.createdAt,
      }));

      return {
        metrics: {
          totalContributors,
          activeRepositories,
          averageContributorsPerRepo,
          averageContributionsPerContributor,
          topContributorContributionCount,
          largestRepositoryCommunity,
        },
        leaderboard,
        repositoryParticipation,
        contributionDistribution: [
          { range: '1-10', count: distributionBuckets['1-10'] },
          { range: '11-50', count: distributionBuckets['11-50'] },
          { range: '51-100', count: distributionBuckets['51-100'] },
          { range: '100+', count: distributionBuckets['100+'] },
        ],
        communityInsights,
        explorer,
        recentContributors,
      };
    } catch (error) {
      this.logger.error(
        'Error generating contributor analytics:',
        error.message,
      );
      throw error;
    }
  }
}

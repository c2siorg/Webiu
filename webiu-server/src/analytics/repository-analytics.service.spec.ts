import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { RepositoryAnalyticsService } from './repository-analytics.service';
import { Contributor } from '../database/entities/contributor.entity';
import { Repository as RepositoryEntity } from '../database/entities/repository.entity';
import { RepositoryContributor } from '../database/entities/repository-contributor.entity';

describe('RepositoryAnalyticsService', () => {
  let service: RepositoryAnalyticsService;
  let contributorRepoMock: any;
  let repoRepoMock: any;
  let repoContributorRepoMock: any;
  let queryBuilderMock: any;

  beforeEach(async () => {
    queryBuilderMock = {
      innerJoin: jest.fn().mockReturnThis(),
      leftJoin: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      addSelect: jest.fn().mockReturnThis(),
      groupBy: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      getRawOne: jest.fn(),
      getRawMany: jest.fn(),
    };

    contributorRepoMock = {
      count: jest.fn(),
    };

    repoRepoMock = {
      count: jest.fn(),
      createQueryBuilder: jest.fn().mockReturnValue(queryBuilderMock),
    };

    repoContributorRepoMock = {
      createQueryBuilder: jest.fn().mockReturnValue(queryBuilderMock),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RepositoryAnalyticsService,
        {
          provide: getRepositoryToken(Contributor),
          useValue: contributorRepoMock,
        },
        {
          provide: getRepositoryToken(RepositoryEntity),
          useValue: repoRepoMock,
        },
        {
          provide: getRepositoryToken(RepositoryContributor),
          useValue: repoContributorRepoMock,
        },
      ],
    }).compile();

    service = module.get<RepositoryAnalyticsService>(
      RepositoryAnalyticsService,
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getRepositoryAnalytics', () => {
    it('should return aggregated repository analytics successfully', async () => {
      // Mock repository counts
      repoRepoMock.count
        .mockResolvedValueOnce(5) // total
        .mockResolvedValueOnce(3) // public
        .mockResolvedValueOnce(2) // private
        .mockResolvedValueOnce(1); // archived
      contributorRepoMock.count.mockResolvedValue(10);

      // Mock raw stars and forks SUM
      queryBuilderMock.getRawOne
        .mockResolvedValueOnce({ totalStars: '120', totalForks: '35' }) // stars & forks
        .mockResolvedValueOnce({ count: '15' }); // connections count

      // Mock raw repositories with contributor counts
      queryBuilderMock.getRawMany.mockResolvedValue([
        {
          id: 'repo-1',
          name: 'repo-one',
          description: 'Repo One Desc',
          stars: '100',
          forks: '25',
          topics: 'typescript,angular',
          visibility: 'public',
          isArchived: false,
          language: 'TypeScript',
          contributorCount: '8',
        },
        {
          id: 'repo-2',
          name: 'repo-two',
          description: 'Repo Two Desc',
          stars: '20',
          forks: '10',
          topics: 'javascript,react',
          visibility: 'public',
          isArchived: false,
          language: 'JavaScript',
          contributorCount: '7',
        },
        {
          id: 'repo-3',
          name: 'repo-three',
          description: null,
          stars: '0',
          forks: '0',
          topics: null,
          visibility: 'private',
          isArchived: true,
          language: null,
          contributorCount: '0',
        },
      ]);

      const result = await service.getRepositoryAnalytics();

      // Check counts & metrics
      expect(result.metrics.totalRepositories).toBe(5);
      expect(result.metrics.publicRepositories).toBe(3);
      expect(result.metrics.privateRepositories).toBe(2);
      expect(result.metrics.archivedRepositories).toBe(1);
      expect(result.metrics.totalStars).toBe(120);
      expect(result.metrics.totalForks).toBe(35);
      expect(result.metrics.averageContributorsPerRepo).toBe(3); // 15 / 5
      expect(result.metrics.averageStarsPerRepo).toBe(24); // 120 / 5
      expect(result.metrics.averageForksPerRepo).toBe(7); // 35 / 5

      // Check Popular Repositories
      expect(result.popularRepositories.length).toBe(3);
      expect(result.popularRepositories[0].name).toBe('repo-one');
      expect(result.popularRepositories[0].stars).toBe(100);

      // Check Community insights
      expect(result.communityInsights.mostStarredRepo.name).toBe('repo-one');
      expect(result.communityInsights.mostStarredRepo.stars).toBe(100);
      expect(result.communityInsights.mostForkedRepo.name).toBe('repo-one');
      expect(result.communityInsights.mostForkedRepo.forks).toBe(25);
      expect(result.communityInsights.largestCommunityRepo.name).toBe(
        'repo-one',
      );
      expect(
        result.communityInsights.largestCommunityRepo.contributorCount,
      ).toBe(8);
      expect(result.communityInsights.leastActiveRepo.name).toBe('repo-two'); // repo-three is archived so repo-two with 7 is min active
      expect(result.communityInsights.archivedRepoCount).toBe(1);

      // Check distributions
      expect(result.visibilityDistribution).toEqual({
        public: 3,
        private: 2,
        archived: 1,
      });

      // Topics: typescript (1), angular (1), javascript (1), react (1)
      expect(result.topicDistribution).toContainEqual({
        topic: 'typescript',
        count: 1,
      });
      expect(result.topicDistribution).toContainEqual({
        topic: 'angular',
        count: 1,
      });

      // Languages: TypeScript (1), JavaScript (1)
      expect(result.languageDistribution).toContainEqual({
        language: 'TypeScript',
        count: 1,
      });
      expect(result.languageDistribution).toContainEqual({
        language: 'JavaScript',
        count: 1,
      });

      // Explorer
      expect(result.explorer.length).toBe(3);
      expect(result.explorer[0].topics).toEqual(['typescript', 'angular']);
    });

    it('should handle empty repository list gracefully', async () => {
      repoRepoMock.count.mockResolvedValue(0);
      contributorRepoMock.count.mockResolvedValue(0);
      queryBuilderMock.getRawOne
        .mockResolvedValueOnce({ totalStars: null, totalForks: null })
        .mockResolvedValueOnce({ count: '0' });
      queryBuilderMock.getRawMany.mockResolvedValue([]);

      const result = await service.getRepositoryAnalytics();

      expect(result.metrics.totalRepositories).toBe(0);
      expect(result.metrics.averageStarsPerRepo).toBe(0);
      expect(result.metrics.averageContributorsPerRepo).toBe(0);
      expect(result.communityInsights.mostStarredRepo).toBeNull();
      expect(result.communityInsights.leastActiveRepo).toBeNull();
      expect(result.popularRepositories).toEqual([]);
      expect(result.topicDistribution).toEqual([]);
      expect(result.languageDistribution).toEqual([]);
    });
  });
});

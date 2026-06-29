import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ContributorAnalyticsService } from './contributor-analytics.service';
import { Contributor } from '../database/entities/contributor.entity';
import { Repository as RepositoryEntity } from '../database/entities/repository.entity';
import { RepositoryContributor } from '../database/entities/repository-contributor.entity';

describe('ContributorAnalyticsService', () => {
  let service: ContributorAnalyticsService;
  let contributorRepoMock: any;
  let repoRepoMock: any;
  let repoContributorRepoMock: any;

  // Mocking QueryBuilder
  let queryBuilderMock: any;

  beforeEach(async () => {
    queryBuilderMock = {
      innerJoin: jest.fn().mockReturnThis(),
      leftJoin: jest.fn().mockReturnThis(),
      innerJoinAndSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      addSelect: jest.fn().mockReturnThis(),
      groupBy: jest.fn().mockReturnThis(),
      addGroupBy: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      addOrderBy: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      getRawOne: jest.fn(),
      getRawMany: jest.fn(),
      getMany: jest.fn(),
    };

    contributorRepoMock = {
      count: jest.fn(),
      find: jest.fn(),
      createQueryBuilder: jest.fn().mockReturnValue(queryBuilderMock),
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
        ContributorAnalyticsService,
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

    service = module.get<ContributorAnalyticsService>(
      ContributorAnalyticsService,
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getContributorAnalytics', () => {
    it('should return aggregated contributor analytics successfully', async () => {
      // Mock Counts
      contributorRepoMock.count.mockResolvedValue(5);
      repoRepoMock.count.mockResolvedValue(3);

      // Mock total connections and total contributions sum
      queryBuilderMock.getRawOne
        .mockResolvedValueOnce({ count: '6' }) // totalConnections
        .mockResolvedValueOnce({ sum: '150' }) // totalContributionsSum
        .mockResolvedValueOnce({ totalContributions: '80' }) // top contributor count
        .mockResolvedValueOnce({ contributorCount: '4' }) // largest repo community
        .mockResolvedValueOnce({
          username: 'alice',
          avatarUrl: 'avatar-alice',
          profileUrl: 'url-alice',
          totalContributions: '80',
          repoCount: '2',
        }) // most active contributor
        .mockResolvedValueOnce({ name: 'Webiu', contributorCount: '4' }) // repo with largest community
        .mockResolvedValueOnce({ name: 'Webiu', avgContributions: '37.5' }) // repo with highest average contributions
        .mockResolvedValueOnce({
          username: 'bob',
          avatarUrl: 'avatar-bob',
          profileUrl: 'url-bob',
          repoCount: '3',
          totalContributions: '60',
        }); // contributor working across most repos

      // Mock leaderboard raw data
      queryBuilderMock.getRawMany
        .mockResolvedValueOnce([
          {
            id: '1',
            username: 'alice',
            avatarUrl: 'avatar-alice',
            profileUrl: 'url-alice',
            totalContributions: '80',
            repoCount: '2',
          },
          {
            id: '2',
            username: 'bob',
            avatarUrl: 'avatar-bob',
            profileUrl: 'url-bob',
            totalContributions: '60',
            repoCount: '3',
          },
        ]) // leaderboardRaw
        .mockResolvedValueOnce([
          { id: 'repo-1', name: 'Webiu', contributorCount: '4' },
          { id: 'repo-2', name: 'OpenHealthStack', contributorCount: '2' },
        ]) // repoParticipationRaw
        .mockResolvedValueOnce([
          { contributorId: '1', totalContributions: '80' },
          { contributorId: '2', totalContributions: '60' },
          { contributorId: '3', totalContributions: '8' },
        ]) // distributionRaw
        .mockResolvedValueOnce([
          {
            id: '1',
            username: 'alice',
            avatarUrl: 'avatar-alice',
            profileUrl: 'url-alice',
            totalContributions: '80',
            repoCount: '2',
          },
          {
            id: '2',
            username: 'bob',
            avatarUrl: 'avatar-bob',
            profileUrl: 'url-bob',
            totalContributions: '60',
            repoCount: '3',
          },
        ]) // explorerRaw
        .mockResolvedValueOnce([
          { contributorId: '1', repoName: 'Webiu' },
          { contributorId: '1', repoName: 'OpenHealthStack' },
          { contributorId: '2', repoName: 'Webiu' },
          { contributorId: '2', repoName: 'OpenHealthStack' },
        ]); // rcMapping for explorer

      // Mock relations for leaderboard
      queryBuilderMock.getMany.mockResolvedValue([
        { contributorId: '1', repository: { name: 'Webiu' } },
        { contributorId: '1', repository: { name: 'OpenHealthStack' } },
        { contributorId: '2', repository: { name: 'Webiu' } },
      ]);

      // Mock recent contributors find
      const mockRecent = [
        {
          id: '1',
          username: 'alice',
          avatarUrl: 'avatar-alice',
          profileUrl: 'url-alice',
          createdAt: new Date(),
        },
      ];
      contributorRepoMock.find.mockResolvedValue(mockRecent);

      const result = await service.getContributorAnalytics();

      expect(result.metrics.totalContributors).toBe(5);
      expect(result.metrics.activeRepositories).toBe(3);
      expect(result.metrics.averageContributorsPerRepo).toBe(2);
      expect(result.metrics.averageContributionsPerContributor).toBe(30);
      expect(result.metrics.topContributorContributionCount).toBe(80);
      expect(result.metrics.largestRepositoryCommunity).toBe(4);

      expect(result.leaderboard).toHaveLength(2);
      expect(result.leaderboard[0].username).toBe('alice');
      expect(result.leaderboard[0].repos).toContain('Webiu');

      expect(result.repositoryParticipation).toHaveLength(2);
      expect(result.repositoryParticipation[0].name).toBe('Webiu');

      expect(result.contributionDistribution).toEqual([
        { range: '1-10', count: 1 },
        { range: '11-50', count: 0 },
        { range: '51-100', count: 2 },
        { range: '100+', count: 0 },
      ]);

      expect(result.communityInsights.mostActiveContributor.username).toBe(
        'alice',
      );
      expect(result.communityInsights.largestCommunityRepo.name).toBe('Webiu');
      expect(
        result.communityInsights.highestAverageContributionsRepo
          .avgContributions,
      ).toBe(37.5);
      expect(result.communityInsights.crossRepoContributor.username).toBe(
        'bob',
      );

      expect(result.explorer).toHaveLength(2);
      expect(result.recentContributors).toHaveLength(1);
    });

    it('should handle empty database state gracefully', async () => {
      contributorRepoMock.count.mockResolvedValue(0);
      repoRepoMock.count.mockResolvedValue(0);

      queryBuilderMock.getRawOne.mockResolvedValue(null);
      queryBuilderMock.getRawMany.mockResolvedValue([]);
      queryBuilderMock.getMany.mockResolvedValue([]);
      contributorRepoMock.find.mockResolvedValue([]);

      const result = await service.getContributorAnalytics();

      expect(result.metrics.totalContributors).toBe(0);
      expect(result.metrics.activeRepositories).toBe(0);
      expect(result.metrics.averageContributorsPerRepo).toBe(0);
      expect(result.metrics.averageContributionsPerContributor).toBe(0);
      expect(result.metrics.topContributorContributionCount).toBe(0);
      expect(result.metrics.largestRepositoryCommunity).toBe(0);

      expect(result.leaderboard).toHaveLength(0);
      expect(result.repositoryParticipation).toHaveLength(0);
      expect(result.contributionDistribution).toEqual([
        { range: '1-10', count: 0 },
        { range: '11-50', count: 0 },
        { range: '51-100', count: 0 },
        { range: '100+', count: 0 },
      ]);
      expect(result.communityInsights.mostActiveContributor).toBeNull();
      expect(result.explorer).toHaveLength(0);
      expect(result.recentContributors).toHaveLength(0);
    });
  });
});

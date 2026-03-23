import { Test, TestingModule } from '@nestjs/testing';
import { ContributorResolver } from './contributor.resolver';
import { ContributorService } from '../contributor/contributor.service';
import { GqlThrottlerGuard } from './gql-throttler.guard';

describe('ContributorResolver', () => {
  let resolver: ContributorResolver;

  const mockContributors = [
    {
      login: 'user1',
      contributions: 50,
      avatar_url: 'url1',
      repos: ['repo1', 'repo2'],
    },
    {
      login: 'user2',
      contributions: 20,
      avatar_url: 'url2',
      repos: ['repo1'],
    },
    {
      login: 'user3',
      contributions: 10,
      avatar_url: 'url3',
      repos: ['repo3'],
    },
  ];

  const mockContributorService = {
    getAllContributors: jest.fn(),
    getPaginatedContributors: jest.fn().mockImplementation((page, limit) => {
      const start = (page - 1) * limit;
      const contributors = mockContributors.slice(start, start + limit);
      return Promise.resolve({
        total: mockContributors.length,
        page,
        limit,
        contributors,
      });
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ContributorResolver,
        { provide: ContributorService, useValue: mockContributorService },
      ],
    })
      .overrideGuard(GqlThrottlerGuard)
      .useValue({ canActivate: () => true })
      .compile();

    resolver = module.get<ContributorResolver>(ContributorResolver);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(resolver).toBeDefined();
  });

  describe('contributors', () => {
    it('should return paginated contributors from the service', async () => {
      const result = await resolver.contributors(1, 30);

      expect(result).toEqual(mockContributors);
      expect(
        mockContributorService.getPaginatedContributors,
      ).toHaveBeenCalledWith(1, 30);
    });

    it('should return empty array when page exceeds data', async () => {
      mockContributorService.getPaginatedContributors.mockResolvedValueOnce({
        total: 3,
        page: 10,
        limit: 30,
        contributors: [],
      });

      const result = await resolver.contributors(10, 30);

      expect(result).toEqual([]);
    });

    it('should respect page and limit for pagination', async () => {
      const result = await resolver.contributors(2, 2);

      expect(result).toEqual([mockContributors[2]]);
    });

    it('should throw BadRequestException when page is less than 1', async () => {
      await expect(resolver.contributors(0, 30)).rejects.toThrow(
        'page must be at least 1',
      );
    });

    it('should throw BadRequestException when limit exceeds 100', async () => {
      await expect(resolver.contributors(1, 101)).rejects.toThrow(
        'limit must be between 1 and 100',
      );
    });
  });
});

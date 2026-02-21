import { Test, TestingModule } from '@nestjs/testing';
import { ContributorResolver } from './contributor.resolver';
import { ContributorService } from '../contributor/contributor.service';

describe('ContributorResolver', () => {
  let resolver: ContributorResolver;

  const mockContributorService = {
    getAllContributors: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ContributorResolver,
        { provide: ContributorService, useValue: mockContributorService },
      ],
    }).compile();

    resolver = module.get<ContributorResolver>(ContributorResolver);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(resolver).toBeDefined();
  });

  describe('contributors', () => {
    it('should return list of contributors from the service', async () => {
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
      ];
      mockContributorService.getAllContributors.mockResolvedValue(
        mockContributors,
      );

      const result = await resolver.contributors();

      expect(result).toEqual(mockContributors);
      expect(mockContributorService.getAllContributors).toHaveBeenCalledTimes(
        1,
      );
    });

    it('should return empty array when no contributors exist', async () => {
      mockContributorService.getAllContributors.mockResolvedValue([]);

      const result = await resolver.contributors();

      expect(result).toEqual([]);
    });
  });
});

/* eslint-disable @typescript-eslint/no-namespace */
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { RepositorySyncService } from './repository-sync.service';
import { GithubService } from '../github/github.service';
import { Repository as RepositoryEntity } from '../database/entities/repository.entity';

describe('RepositorySyncService', () => {
  let service: RepositorySyncService;
  let repoRepositoryMock: any;
  let githubServiceMock: any;

  beforeEach(async () => {
    repoRepositoryMock = {
      count: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn().mockImplementation((dto) => ({ ...dto })),
      save: jest.fn(),
    };

    githubServiceMock = {
      getAllOrgReposSorted: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RepositorySyncService,
        {
          provide: getRepositoryToken(RepositoryEntity),
          useValue: repoRepositoryMock,
        },
        {
          provide: GithubService,
          useValue: githubServiceMock,
        },
      ],
    }).compile();

    service = module.get<RepositorySyncService>(RepositorySyncService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('onApplicationBootstrap', () => {
    it('should trigger syncRepositories if repository count is 0', async () => {
      repoRepositoryMock.count.mockResolvedValue(0);
      githubServiceMock.getAllOrgReposSorted.mockResolvedValue([]);

      const syncSpy = jest
        .spyOn(service, 'syncRepositories')
        .mockResolvedValue(undefined);

      await service.onApplicationBootstrap();

      expect(repoRepositoryMock.count).toHaveBeenCalled();
      expect(syncSpy).toHaveBeenCalled();
    });

    it('should NOT trigger syncRepositories if repository count is greater than 0', async () => {
      repoRepositoryMock.count.mockResolvedValue(5);

      const syncSpy = jest.spyOn(service, 'syncRepositories');

      await service.onApplicationBootstrap();

      expect(repoRepositoryMock.count).toHaveBeenCalled();
      expect(syncSpy).not.toHaveBeenCalled();
    });
  });

  describe('syncRepositories', () => {
    it('should fetch from Github and upsert new and existing repositories', async () => {
      const mockGithubRepos = [
        {
          id: 12345,
          name: 'repo-one',
          description: 'Desc 1',
          homepage: 'Home 1',
          topics: ['topic-1'],
          stargazers_count: 10,
          forks_count: 5,
        },
        {
          id: 67890,
          name: 'repo-two',
          description: 'Desc 2',
          homepage: 'Home 2',
          topics: ['topic-2'],
          stargazers_count: 20,
          forks_count: 10,
        },
      ];

      githubServiceMock.getAllOrgReposSorted.mockResolvedValue(mockGithubRepos);

      // First repo exists, second does not
      repoRepositoryMock.findOne
        .mockResolvedValueOnce({
          githubRepoId: '12345',
          name: 'old-name',
        } as RepositoryEntity)
        .mockResolvedValueOnce(null);

      await service.syncRepositories();

      expect(githubServiceMock.getAllOrgReposSorted).toHaveBeenCalled();
      expect(repoRepositoryMock.findOne).toHaveBeenNiftyOrUniquelyCalledWith({
        where: { githubRepoId: '12345' },
      });
      expect(repoRepositoryMock.findOne).toHaveBeenNiftyOrUniquelyCalledWith({
        where: { githubRepoId: '67890' },
      });

      expect(repoRepositoryMock.create).toHaveBeenCalledWith({
        githubRepoId: '67890',
      });
      expect(repoRepositoryMock.save).toHaveBeenCalledTimes(2);
    });
  });
});

// Custom matcher helper to handle calls safely
const customMatcher = {
  toHaveBeenNiftyOrUniquelyCalledWith(received: any, expected: any) {
    const pass = received.mock.calls.some(
      (call: any) => JSON.stringify(call[0]) === JSON.stringify(expected),
    );
    return {
      pass,
      message: () =>
        `expected ${received.mockName} to have been called with ${JSON.stringify(expected)}`,
    };
  },
};
expect.extend(customMatcher);

declare global {
  namespace jest {
    interface Matchers<R> {
      toHaveBeenNiftyOrUniquelyCalledWith(expected: any): R;
    }
  }
}

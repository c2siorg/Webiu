/* eslint-disable @typescript-eslint/no-namespace */
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { RepositorySyncService } from './repository-sync.service';
import { GithubService } from '../github/github.service';
import { Repository as RepositoryEntity } from '../database/entities/repository.entity';
import { Contributor } from '../database/entities/contributor.entity';
import { RepositoryContributor } from '../database/entities/repository-contributor.entity';

describe('RepositorySyncService', () => {
  let service: RepositorySyncService;
  let repoRepositoryMock: any;
  let contributorRepositoryMock: any;
  let repoContributorRepositoryMock: any;
  let githubServiceMock: any;

  beforeEach(async () => {
    repoRepositoryMock = {
      count: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn().mockImplementation((dto) => ({ ...dto })),
      save: jest
        .fn()
        .mockImplementation((obj) =>
          Promise.resolve({ id: 'mock-repo-uuid', ...obj }),
        ),
    };

    contributorRepositoryMock = {
      findOne: jest.fn(),
      create: jest.fn().mockImplementation((dto) => ({ ...dto })),
      save: jest
        .fn()
        .mockImplementation((obj) =>
          Promise.resolve({ id: 'mock-contributor-uuid', ...obj }),
        ),
    };

    repoContributorRepositoryMock = {
      findOne: jest.fn(),
      create: jest.fn().mockImplementation((dto) => ({ ...dto })),
      save: jest.fn().mockImplementation((obj) => Promise.resolve(obj)),
      delete: jest.fn(),
    };

    githubServiceMock = {
      org: 'c2siorg',
      getAllOrgReposSorted: jest.fn(),
      getRepoContributors: jest.fn().mockResolvedValue([]),
      getPublicUserProfile: jest
        .fn()
        .mockResolvedValue({ name: 'Mock User', bio: 'Mock Bio' }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RepositorySyncService,
        {
          provide: getRepositoryToken(RepositoryEntity),
          useValue: repoRepositoryMock,
        },
        {
          provide: getRepositoryToken(Contributor),
          useValue: contributorRepositoryMock,
        },
        {
          provide: getRepositoryToken(RepositoryContributor),
          useValue: repoContributorRepositoryMock,
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

  describe('syncContributorsForRepository', () => {
    it('should fetch contributors, upsert them, and save relationships', async () => {
      const mockRepo = {
        id: 'mock-repo-uuid',
        name: 'repo-one',
      } as RepositoryEntity;
      const mockGitContributors = [
        {
          id: 999,
          login: 'contributor-1',
          avatar_url: 'url-1',
          html_url: 'profile-1',
          contributions: 15,
        },
      ];

      githubServiceMock.getRepoContributors.mockResolvedValue(
        mockGitContributors,
      );
      contributorRepositoryMock.findOne.mockResolvedValue(null); // New contributor
      repoContributorRepositoryMock.findOne.mockResolvedValue(null); // New relationship

      await service.syncContributorsForRepository(mockRepo);

      expect(githubServiceMock.getRepoContributors).toHaveBeenCalledWith(
        'c2siorg',
        'repo-one',
      );
      expect(contributorRepositoryMock.findOne).toHaveBeenCalledWith({
        where: { githubUserId: '999' },
      });
      expect(githubServiceMock.getPublicUserProfile).toHaveBeenCalledWith(
        'contributor-1',
      );
      expect(contributorRepositoryMock.create).toHaveBeenCalledWith({
        githubUserId: '999',
        username: 'contributor-1',
        avatarUrl: 'url-1',
        profileUrl: 'profile-1',
      });
      expect(contributorRepositoryMock.save).toHaveBeenCalled();
      expect(repoContributorRepositoryMock.create).toHaveBeenCalledWith({
        repositoryId: 'mock-repo-uuid',
        contributorId: 'mock-contributor-uuid',
      });
      expect(repoContributorRepositoryMock.save).toHaveBeenCalled();
      expect(repoContributorRepositoryMock.delete).toHaveBeenCalled();
    });

    it('should update existing contributor profile without calling getPublicUserProfile', async () => {
      const mockRepo = {
        id: 'mock-repo-uuid',
        name: 'repo-one',
      } as RepositoryEntity;
      const mockGitContributors = [
        {
          id: 999,
          login: 'contributor-1',
          avatar_url: 'url-1-new',
          html_url: 'profile-1',
          contributions: 20,
        },
      ];

      githubServiceMock.getRepoContributors.mockResolvedValue(
        mockGitContributors,
      );
      contributorRepositoryMock.findOne.mockResolvedValue({
        id: 'mock-contributor-uuid',
        username: 'contributor-1',
      });
      repoContributorRepositoryMock.findOne.mockResolvedValue({
        repositoryId: 'mock-repo-uuid',
        contributorId: 'mock-contributor-uuid',
      });

      await service.syncContributorsForRepository(mockRepo);

      expect(githubServiceMock.getPublicUserProfile).not.toHaveBeenCalled();
      expect(contributorRepositoryMock.save).toHaveBeenCalled();
      expect(repoContributorRepositoryMock.save).toHaveBeenCalled();
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

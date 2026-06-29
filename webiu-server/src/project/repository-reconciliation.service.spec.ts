import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RepositoryReconciliationService } from './repository-reconciliation.service';
import { GithubService } from '../github/github.service';
import { RepositorySyncService } from './repository-sync.service';
import { Repository as RepositoryEntity } from '../database/entities/repository.entity';

describe('RepositoryReconciliationService', () => {
  let service: RepositoryReconciliationService;
  let repoRepository: Repository<RepositoryEntity>;
  let syncService: RepositorySyncService;

  const mockGithubService = {
    getAllOrgReposSorted: jest.fn(),
  };

  const mockRepoRepository = {
    find: jest.fn(),
    create: jest.fn((data) => ({
      ...data,
      id: 'mock-uuid',
      topics: [],
    })),
    save: jest.fn((entity) => Promise.resolve(entity)),
  };

  const mockRepositorySyncService = {
    saveRepositoryData: jest.fn((repo, gitRepo, source) => {
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
      return Promise.resolve(repo);
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RepositoryReconciliationService,
        { provide: GithubService, useValue: mockGithubService },
        { provide: RepositorySyncService, useValue: mockRepositorySyncService },
        {
          provide: getRepositoryToken(RepositoryEntity),
          useValue: mockRepoRepository,
        },
      ],
    }).compile();

    service = module.get<RepositoryReconciliationService>(
      RepositoryReconciliationService,
    );
    repoRepository = module.get<Repository<RepositoryEntity>>(
      getRepositoryToken(RepositoryEntity),
    );
    syncService = module.get<RepositorySyncService>(RepositorySyncService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should ingest missing repositories', async () => {
    const gitRepos = [
      {
        id: 12345,
        name: 'new-repo',
        description: 'New Description',
        homepage: 'http://new.com',
        topics: ['new'],
        stargazers_count: 5,
        forks_count: 2,
      },
    ];

    mockGithubService.getAllOrgReposSorted.mockResolvedValue(gitRepos);
    mockRepoRepository.find.mockResolvedValue([]);

    await service.reconcileRepositories();

    expect(repoRepository.create).toHaveBeenCalledWith({
      githubRepoId: '12345',
    });
    expect(syncService.saveRepositoryData).toHaveBeenCalledWith(
      expect.objectContaining({
        githubRepoId: '12345',
      }),
      expect.objectContaining({
        id: 12345,
        name: 'new-repo',
      }),
      'cron',
    );
  });

  it('should recover drifted repository details', async () => {
    const gitRepos = [
      {
        id: 12345,
        name: 'drift-repo',
        description: 'Updated Description',
        homepage: 'http://updated.com',
        topics: ['updated'],
        stargazers_count: 10,
        forks_count: 4,
      },
    ];

    const dbRepo = {
      githubRepoId: '12345',
      name: 'drift-repo',
      description: 'Old Description',
      homepage: 'http://old.com',
      topics: ['old'],
      stars: 2,
      forks: 1,
      isActive: true,
    } as RepositoryEntity;

    mockGithubService.getAllOrgReposSorted.mockResolvedValue(gitRepos);
    mockRepoRepository.find.mockResolvedValue([dbRepo]);

    await service.reconcileRepositories();

    expect(syncService.saveRepositoryData).toHaveBeenCalledWith(
      expect.objectContaining({
        githubRepoId: '12345',
      }),
      expect.objectContaining({
        id: 12345,
        name: 'drift-repo',
      }),
      'cron',
    );
  });

  it('should soft-delete repositories missing from GitHub', async () => {
    const gitRepos = [] as any[];

    const dbRepo = {
      githubRepoId: '12345',
      name: 'deleted-repo',
      isActive: true,
    } as RepositoryEntity;

    mockGithubService.getAllOrgReposSorted.mockResolvedValue(gitRepos);
    mockRepoRepository.find.mockResolvedValue([dbRepo]);

    await service.reconcileRepositories();

    expect(repoRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        githubRepoId: '12345',
        name: 'deleted-repo',
        isActive: false,
        syncStatus: 'success',
        reconciliationSource: 'cron',
        lastReconciliationAt: expect.any(Date),
      }),
    );
  });

  it('should not update repositories without drift', async () => {
    const gitRepos = [
      {
        id: 12345,
        name: 'no-drift-repo',
        description: 'Same Description',
        homepage: 'http://same.com',
        topics: ['same'],
        stargazers_count: 10,
        forks_count: 4,
        private: false,
        archived: false,
        language: 'TypeScript',
      },
    ];

    const dbRepo = {
      githubRepoId: '12345',
      name: 'no-drift-repo',
      description: 'Same Description',
      homepage: 'http://same.com',
      topics: ['same'],
      stars: 10,
      forks: 4,
      isActive: true,
      visibility: 'public',
      isArchived: false,
      language: 'TypeScript',
    } as RepositoryEntity;

    mockGithubService.getAllOrgReposSorted.mockResolvedValue(gitRepos);
    mockRepoRepository.find.mockResolvedValue([dbRepo]);

    await service.reconcileRepositories();

    expect(syncService.saveRepositoryData).not.toHaveBeenCalled();
    expect(repoRepository.save).not.toHaveBeenCalled();
  });
});

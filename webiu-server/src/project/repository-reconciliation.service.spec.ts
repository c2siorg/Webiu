import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RepositoryReconciliationService } from './repository-reconciliation.service';
import { GithubService } from '../github/github.service';
import { Repository as RepositoryEntity } from '../database/entities/repository.entity';

describe('RepositoryReconciliationService', () => {
  let service: RepositoryReconciliationService;
  let repoRepository: Repository<RepositoryEntity>;

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

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RepositoryReconciliationService,
        { provide: GithubService, useValue: mockGithubService },
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
    expect(repoRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        githubRepoId: '12345',
        name: 'new-repo',
        description: 'New Description',
        homepage: 'http://new.com',
        topics: ['new'],
        stars: 5,
        forks: 2,
        isActive: true,
        syncStatus: 'success',
        reconciliationSource: 'cron',
      }),
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

    expect(repoRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        githubRepoId: '12345',
        name: 'drift-repo',
        description: 'Updated Description',
        homepage: 'http://updated.com',
        topics: ['updated'],
        stars: 10,
        forks: 4,
        isActive: true,
        syncStatus: 'success',
        reconciliationSource: 'cron',
      }),
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
    } as RepositoryEntity;

    mockGithubService.getAllOrgReposSorted.mockResolvedValue(gitRepos);
    mockRepoRepository.find.mockResolvedValue([dbRepo]);

    await service.reconcileRepositories();

    expect(repoRepository.save).not.toHaveBeenCalled();
  });
});

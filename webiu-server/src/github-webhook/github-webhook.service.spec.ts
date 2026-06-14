import { Test, TestingModule } from '@nestjs/testing';
import { GithubWebhookService } from './github-webhook.service';
import { RepositorySyncService } from '../project/repository-sync.service';

describe('GithubWebhookService', () => {
  let service: GithubWebhookService;
  let syncService: RepositorySyncService;

  const mockRepositorySyncService = {
    syncSingleRepository: jest.fn(),
    deleteRepository: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GithubWebhookService,
        { provide: RepositorySyncService, useValue: mockRepositorySyncService },
      ],
    }).compile();

    service = module.get<GithubWebhookService>(GithubWebhookService);
    syncService = module.get<RepositorySyncService>(RepositorySyncService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should ignore non-repository events', async () => {
    await service.handleWebhookEvent('push', { action: 'created' });
    expect(syncService.syncSingleRepository).not.toHaveBeenCalled();
    expect(syncService.deleteRepository).not.toHaveBeenCalled();
  });

  it('should trigger syncSingleRepository on created, edited, renamed, unarchived actions', async () => {
    const actions = ['created', 'edited', 'renamed', 'unarchived'];
    for (const action of actions) {
      await service.handleWebhookEvent('repository', {
        action,
        repository: { name: 'test-repo' },
      });
      expect(syncService.syncSingleRepository).toHaveBeenCalledWith(
        'test-repo',
      );
    }
    expect(syncService.deleteRepository).not.toHaveBeenCalled();
  });

  it('should trigger deleteRepository on deleted and archived actions', async () => {
    const actions = ['deleted', 'archived'];
    for (const action of actions) {
      await service.handleWebhookEvent('repository', {
        action,
        repository: { name: 'test-repo' },
      });
      expect(syncService.deleteRepository).toHaveBeenCalledWith('test-repo');
    }
    expect(syncService.syncSingleRepository).not.toHaveBeenCalled();
  });
});

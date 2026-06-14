import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { ProjectController, IssuesController } from './project.controller';
import { ProjectService } from './project.service';
import { RepositorySyncService } from './repository-sync.service';
import { AdminGuard } from '../auth/guards/admin.guard';
import { Admin } from '../database/entities/admin.entity';

describe('ProjectController', () => {
  let controller: ProjectController;
  let syncService: RepositorySyncService;

  const mockProjectService = {
    getAllProjects: jest.fn(),
    getIssuesAndPr: jest.fn(),
    searchProjects: jest.fn(),
    getProjectByName: jest.fn(),
    getRepoTechStack: jest.fn(),
    getProjectInsights: jest.fn(),
    getProjectContributors: jest.fn(),
  };

  const mockRepositorySyncService = {
    syncRepositories: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProjectController],
      providers: [
        { provide: ProjectService, useValue: mockProjectService },
        { provide: RepositorySyncService, useValue: mockRepositorySyncService },
        {
          provide: AdminGuard,
          useValue: { canActivate: jest.fn().mockReturnValue(true) },
        },
        {
          provide: JwtService,
          useValue: { verify: jest.fn() },
        },
        {
          provide: getRepositoryToken(Admin),
          useValue: {},
        },
      ],
    }).compile();

    controller = module.get<ProjectController>(ProjectController);
    syncService = module.get<RepositorySyncService>(RepositorySyncService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('syncRepositories', () => {
    it('should call syncService.syncRepositories and return success', async () => {
      mockRepositorySyncService.syncRepositories.mockResolvedValue(undefined);

      const result = await controller.syncRepositories();

      expect(result).toEqual({
        success: true,
        message: 'Repositories synchronized successfully',
      });
      expect(syncService.syncRepositories).toHaveBeenCalled();
    });
  });

  describe('getAllProjects', () => {
    it('should pass parsed page/limit to service and return its value', async () => {
      const mockResult = { repositories: [{ name: 'repo1' }] };
      mockProjectService.getAllProjects.mockResolvedValue(mockResult);

      const result = await controller.getAllProjects('2', '5');

      expect(result).toEqual(mockResult);
      expect(mockProjectService.getAllProjects).toHaveBeenCalledWith(2, 5);
    });

    it('should default page/limit when none provided', async () => {
      const mockResult = { repositories: [] };
      mockProjectService.getAllProjects.mockResolvedValue(mockResult);

      const result = await controller.getAllProjects();

      expect(result).toEqual(mockResult);
      expect(mockProjectService.getAllProjects).toHaveBeenCalledWith(1, 10);
    });
  });

  describe('getRepoTechStack', () => {
    it('should return tech stack from service', async () => {
      const mockResult = { languages: ['TypeScript', 'JavaScript'] };
      mockProjectService.getRepoTechStack.mockResolvedValue(mockResult);

      const result = await controller.getRepoTechStack('Webiu');

      expect(result).toEqual(mockResult);
      expect(mockProjectService.getRepoTechStack).toHaveBeenCalledWith('Webiu');
    });
  });
});

describe('IssuesController', () => {
  let controller: IssuesController;

  const mockProjectService = {
    getAllProjects: jest.fn(),
    getIssuesAndPr: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [IssuesController],
      providers: [{ provide: ProjectService, useValue: mockProjectService }],
    }).compile();

    controller = module.get<IssuesController>(IssuesController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getIssuesAndPr', () => {
    it('should return issues and PR counts', async () => {
      const mockResult = { issues: 5, pullRequests: 3 };
      mockProjectService.getIssuesAndPr.mockResolvedValue(mockResult);

      const result = await controller.getIssuesAndPr('c2siorg', 'repo1');

      expect(result).toEqual(mockResult);
      expect(mockProjectService.getIssuesAndPr).toHaveBeenCalledWith(
        'c2siorg',
        'repo1',
      );
    });
  });
});

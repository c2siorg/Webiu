import { Test, TestingModule } from '@nestjs/testing';
import { ProjectController, IssuesController } from './project.controller';
import { ProjectService } from './project.service';
import { PaginationQueryDto } from './dto/pagination-query.dto';

describe('ProjectController', () => {
  let controller: ProjectController;

  const mockProjectService = {
    getAllProjects: jest.fn(),
    getIssuesAndPr: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProjectController],
      providers: [{ provide: ProjectService, useValue: mockProjectService }],
    }).compile();

    controller = module.get<ProjectController>(ProjectController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getAllProjects', () => {
    it('should return paginated projects from the service', async () => {
      const mockResult = {
        total: 20,
        page: 2,
        limit: 5,
        repositories: [
          { name: 'repo1', pull_requests: 3 },
          { name: 'repo2', pull_requests: 1 },
        ],
      };
      mockProjectService.getAllProjects.mockResolvedValue(mockResult);

      const query: PaginationQueryDto = { page: 2, limit: 5 };
      const result = await controller.getAllProjects(query);

      expect(result).toEqual(mockResult);
      expect(mockProjectService.getAllProjects).toHaveBeenCalledWith(2, 5);
    });

    it('should use default page=1 and limit=10 when query params are omitted', async () => {
      const mockResult = {
        total: 0,
        page: 1,
        limit: 10,
        repositories: [],
      };
      mockProjectService.getAllProjects.mockResolvedValue(mockResult);

      const query: PaginationQueryDto = {};
      const result = await controller.getAllProjects(query);

      expect(result).toEqual(mockResult);
      expect(mockProjectService.getAllProjects).toHaveBeenCalledWith(1, 10);
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

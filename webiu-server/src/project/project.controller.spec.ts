import { Test, TestingModule } from '@nestjs/testing';
import { ProjectController, IssuesController } from './project.controller';
import { ProjectService } from './project.service';

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
    it('should pass parsed page/limit to service and return its value', async () => {
      const mockResult = { data: [{ name: 'repo1' }], total: 1, page: 1, limit: 10 };
      mockProjectService.getAllProjects.mockResolvedValue(mockResult);

      const result = await controller.getAllProjects('2', '5');

      expect(result).toEqual(mockResult);
      expect(mockProjectService.getAllProjects).toHaveBeenCalledWith(2, 5);
    });

    it('should default page/limit when none provided', async () => {
      const mockResult = { data: [], total: 0, page: 1, limit: 10 };
      mockProjectService.getAllProjects.mockResolvedValue(mockResult);

      const result = await controller.getAllProjects();

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

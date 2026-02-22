import { Test, TestingModule } from '@nestjs/testing';
import { ValidationPipe } from '@nestjs/common';
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
    it('should return all projects from the service', async () => {
      const mockResult = {
        repositories: [
          { name: 'repo1', pull_requests: 3 },
          { name: 'repo2', pull_requests: 1 },
        ],
      };
      mockProjectService.getAllProjects.mockResolvedValue(mockResult);

      const result = await controller.getAllProjects();

      expect(result).toEqual(mockResult);
      expect(mockProjectService.getAllProjects).toHaveBeenCalledTimes(1);
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

    it('should reject invalid org name with special characters', async () => {
      const pipe = new ValidationPipe();
      const dto = { org: '../../etc/passwd', repo: 'repo1' };
      await expect(
        pipe.transform(dto, { type: 'query', metatype: OrgRepoQueryDto }),
      ).rejects.toThrow();
    });

    it('should reject org name exceeding 39 characters', async () => {
      const pipe = new ValidationPipe();
      const dto = { org: 'a'.repeat(40), repo: 'repo1' };
      await expect(
        pipe.transform(dto, { type: 'query', metatype: OrgRepoQueryDto }),
      ).rejects.toThrow();
    });

    it('should reject missing org', async () => {
      const pipe = new ValidationPipe();
      const dto = { org: '', repo: 'repo1' };
      await expect(
        pipe.transform(dto, { type: 'query', metatype: OrgRepoQueryDto }),
      ).rejects.toThrow();
    });

    it('should reject invalid repo name with special characters', async () => {
      const pipe = new ValidationPipe();
      const dto = { org: 'c2siorg', repo: 'repo name!' };
      await expect(
        pipe.transform(dto, { type: 'query', metatype: OrgRepoQueryDto }),
      ).rejects.toThrow();
    });
  });
});

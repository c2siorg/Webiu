import { Test, TestingModule } from '@nestjs/testing';
import { ProjectResolver } from './project.resolver';
import { ProjectService } from '../project/project.service';

describe('ProjectResolver', () => {
  let resolver: ProjectResolver;

  const mockProjectService = {
    getAllProjects: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProjectResolver,
        { provide: ProjectService, useValue: mockProjectService },
      ],
    }).compile();

    resolver = module.get<ProjectResolver>(ProjectResolver);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(resolver).toBeDefined();
  });

  describe('repositories', () => {
    it('should return list of repositories from the service', async () => {
      const mockRepositories = [
        {
          name: 'repo1',
          pull_requests: 3,
          stargazers_count: 10,
          forks_count: 2,
        },
        {
          name: 'repo2',
          pull_requests: 1,
          stargazers_count: 5,
          forks_count: 1,
        },
      ];
      mockProjectService.getAllProjects.mockResolvedValue({
        repositories: mockRepositories,
      });

      const result = await resolver.repositories();

      expect(result).toEqual(mockRepositories);
      expect(mockProjectService.getAllProjects).toHaveBeenCalledTimes(1);
    });

    it('should return empty array when no repositories exist', async () => {
      mockProjectService.getAllProjects.mockResolvedValue({ repositories: [] });

      const result = await resolver.repositories();

      expect(result).toEqual([]);
    });
  });
});

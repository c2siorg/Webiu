import { Test, TestingModule } from '@nestjs/testing';
import { ContributorController } from './contributor.controller';
import { ContributorService } from './contributor.service';

describe('ContributorController', () => {
  let controller: ContributorController;

  const mockContributorService = {
    getAllContributors: jest.fn(),
    getUserCreatedIssues: jest.fn(),
    getUserCreatedPullRequests: jest.fn(),
    getUserStats: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ContributorController],
      providers: [
        { provide: ContributorService, useValue: mockContributorService },
      ],
    }).compile();

    controller = module.get<ContributorController>(ContributorController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getAllContributors', () => {
    it('should return all contributors', async () => {
      const mockResult = [{ login: 'user1', contributions: 10 }];
      mockContributorService.getAllContributors.mockResolvedValue(mockResult);

      const result = await controller.getAllContributors();
      expect(result).toEqual(mockResult);
    });
  });

  describe('userCreatedIssues', () => {
    it('should return issues for a username', async () => {
      const mockResult = { issues: [{ id: 1 }] };
      mockContributorService.getUserCreatedIssues.mockResolvedValue(mockResult);

      const result = await controller.userCreatedIssues('testuser');
      expect(result).toEqual(mockResult);
    });
  });

  describe('userCreatedPullRequests', () => {
    it('should return PRs for a username', async () => {
      const mockResult = { pullRequests: [{ id: 1 }] };
      mockContributorService.getUserCreatedPullRequests.mockResolvedValue(
        mockResult,
      );

      const result = await controller.userCreatedPullRequests('testuser');
      expect(result).toEqual(mockResult);
    });
  });

  describe('getUserStats', () => {
    it('should return combined issues and PRs', async () => {
      const mockResult = { issues: [{ id: 1 }], pullRequests: [{ id: 2 }] };
      mockContributorService.getUserStats.mockResolvedValue(mockResult);

      const result = await controller.getUserStats('testuser');
      expect(result).toEqual(mockResult);
      expect(mockContributorService.getUserStats).toHaveBeenCalledWith(
        'testuser',
      );
    });
  });
});

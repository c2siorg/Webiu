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
    it('should forward page/limit and return service response', async () => {
      const mockResult = { data: [{ login: 'user1' }], total: 1, page: 2, limit: 5 };
      mockContributorService.getAllContributors.mockResolvedValue(mockResult);

      const result = await controller.getAllContributors('2', '5');
      expect(result).toEqual(mockResult);
      expect(mockContributorService.getAllContributors).toHaveBeenCalledWith(2, 5);
    });

    it('should default page/limit when not provided', async () => {
      const mockResult = { data: [], total: 0, page: 1, limit: 10 };
      mockContributorService.getAllContributors.mockResolvedValue(mockResult);

      const result = await controller.getAllContributors();
      expect(result).toEqual(mockResult);
      expect(mockContributorService.getAllContributors).toHaveBeenCalledWith(1, 10);
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

import { Test, TestingModule } from '@nestjs/testing';
import { ContributorController } from './contributor.controller';
import { ContributorService } from './contributor.service';
import { UsernameDto } from './dto/username.dto';

describe('ContributorController', () => {
  let controller: ContributorController;
  let service: ContributorService;

  const mockContributorService = {
    getAllContributors: jest.fn(),
    getUserCreatedIssues: jest.fn(),
    getUserCreatedPullRequests: jest.fn(),
    getUserStats: jest.fn(),
    getUserFollowersAndFollowing: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ContributorController],
      providers: [
        { provide: ContributorService, useValue: mockContributorService },
      ],
    }).compile();

    controller = module.get<ContributorController>(ContributorController);
    service = module.get<ContributorService>(ContributorService);
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.clearAllTimers();
  });

  afterAll(() => {
    jest.useRealTimers();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getAllContributors', () => {
    it('should return all contributors from service', async () => {
      const mockResult = [{ login: 'user1' }, { login: 'user2' }];
      mockContributorService.getAllContributors.mockResolvedValue(mockResult);

      const result = await controller.getAllContributors();
      expect(result).toEqual(mockResult);
      expect(mockContributorService.getAllContributors).toHaveBeenCalled();
    });
  });

  describe('userCreatedIssues', () => {
    it('should return issues for a valid username', async () => {
      const mockResult = { issues: [{ id: 1 }] };
      const params: UsernameDto = { username: 'testuser' };
      mockContributorService.getUserCreatedIssues.mockResolvedValue(mockResult);

      const result = await controller.userCreatedIssues(params);
      expect(result).toEqual(mockResult);
      expect(service.getUserCreatedIssues).toHaveBeenCalledWith('testuser');
    });

    it('should handle usernames with hyphens and underscores', async () => {
      const mockResult = { issues: [{ id: 1 }] };
      const params: UsernameDto = { username: 'test-user_123' };
      mockContributorService.getUserCreatedIssues.mockResolvedValue(mockResult);

      const result = await controller.userCreatedIssues(params);
      expect(result).toEqual(mockResult);
      expect(service.getUserCreatedIssues).toHaveBeenCalledWith(
        'test-user_123',
      );
    });
  });

  describe('userCreatedPullRequests', () => {
    it('should return PRs for a valid username', async () => {
      const mockResult = { pullRequests: [{ id: 1 }] };
      const params: UsernameDto = { username: 'testuser' };
      mockContributorService.getUserCreatedPullRequests.mockResolvedValue(
        mockResult,
      );

      const result = await controller.userCreatedPullRequests(params);
      expect(result).toEqual(mockResult);
      expect(service.getUserCreatedPullRequests).toHaveBeenCalledWith(
        'testuser',
      );
    });
  });

  describe('getUserStats', () => {
    it('should return combined issues and PRs for a valid username', async () => {
      const mockResult = { issues: [{ id: 1 }], pullRequests: [{ id: 2 }] };
      const params: UsernameDto = { username: 'testuser' };
      mockContributorService.getUserStats.mockResolvedValue(mockResult);

      const result = await controller.getUserStats(params);
      expect(result).toEqual(mockResult);
      expect(mockContributorService.getUserStats).toHaveBeenCalledWith(
        'testuser',
      );
    });
  });

  describe('getUserFollowersAndFollowing', () => {
    it('should return followers and following for a valid username', async () => {
      const mockResult = { followers: 100, following: 50 };
      const params: UsernameDto = { username: 'testuser' };
      mockContributorService.getUserFollowersAndFollowing.mockResolvedValue(
        mockResult,
      );

      const result = await controller.getUserFollowersAndFollowing(params);
      expect(result).toEqual(mockResult);
      expect(service.getUserFollowersAndFollowing).toHaveBeenCalledWith(
        'testuser',
      );
    });
  });
});

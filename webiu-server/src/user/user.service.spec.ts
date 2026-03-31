import { Test, TestingModule } from '@nestjs/testing';
import { UserService } from './user.service';
import { GithubService } from '../github/github.service';

describe('UserService', () => {
  let service: UserService;

  const mockGithubService = {
    getPublicUserProfile: jest.fn(),
    getUserFollowersAndFollowing: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        { provide: GithubService, useValue: mockGithubService },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getFollowersAndFollowing', () => {
    it('should return followers and following count', async () => {
      mockGithubService.getUserFollowersAndFollowing.mockResolvedValue({
        followers: 100,
        following: 50,
      });

      const result = await service.getFollowersAndFollowing('testuser');

      expect(result).toEqual({ followers: 100, following: 50 });
      expect(
        mockGithubService.getUserFollowersAndFollowing,
      ).toHaveBeenCalledWith('testuser');
      expect(
        mockGithubService.getUserFollowersAndFollowing,
      ).toHaveBeenCalledTimes(1);
    });
  });

  describe('getUserProfile', () => {
    it('should return user profile', async () => {
      const mockProfile = {
        login: 'testuser',
        avatar_url: 'url',
        public_repos: 10,
        followers: 5,
        following: 2,
      };

      mockGithubService.getPublicUserProfile.mockResolvedValue(mockProfile);

      const result = await service.getUserProfile('testuser');

      expect(result).toEqual(mockProfile);
      expect(mockGithubService.getPublicUserProfile).toHaveBeenCalledWith(
        'testuser',
      );
    });
  });

  describe('batchFollowersAndFollowing', () => {
    it('should return followers/following for multiple users', async () => {
      mockGithubService.getUserFollowersAndFollowing
        .mockResolvedValueOnce({ followers: 10, following: 5 })
        .mockResolvedValueOnce({ followers: 20, following: 15 });

      const result = await service.batchFollowersAndFollowing([
        'user1',
        'user2',
      ]);

      expect(result).toEqual({
        user1: { followers: 10, following: 5 },
        user2: { followers: 20, following: 15 },
      });
    });

    it('should skip failed users and return successful ones', async () => {
      mockGithubService.getUserFollowersAndFollowing
        .mockResolvedValueOnce({ followers: 10, following: 5 })
        .mockRejectedValueOnce(new Error('API error'));

      const result = await service.batchFollowersAndFollowing([
        'user1',
        'user2',
      ]);

      expect(result).toEqual({
        user1: { followers: 10, following: 5 },
      });
    });

    it('should process all users in batches correctly', async () => {
      const users = Array.from({ length: 12 }, (_, i) => `user${i}`);

      mockGithubService.getUserFollowersAndFollowing.mockResolvedValue({
        followers: 1,
        following: 1,
      });

      const result = await service.batchFollowersAndFollowing(users);

      expect(Object.keys(result).length).toBe(12);
      expect(
        mockGithubService.getUserFollowersAndFollowing,
      ).toHaveBeenCalledTimes(12);
    });
  });
});
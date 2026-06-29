import { Test, TestingModule } from '@nestjs/testing';
import { UserService } from './user.service';
import { GithubService } from '../github/github.service';
import { InternalServerErrorException, Logger } from '@nestjs/common';

describe('UserService', () => {
  let service: UserService;
  const mockGithubService = {
    getPublicUserProfile: jest.fn(),
    getUserFollowersAndFollowing: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        { provide: GithubService, useValue: mockGithubService },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
    jest.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getFollowersAndFollowing', () => {
    it('should return followers and following on success', async () => {
      mockGithubService.getUserFollowersAndFollowing.mockResolvedValue({
        followers: 100,
        following: 50,
      });
      const result = await service.getFollowersAndFollowing('testuser');
      expect(result).toEqual({ followers: 100, following: 50 });
    });

    it('should throw InternalServerErrorException and log on failure', async () => {
      const error = new Error('GitHub API error');
      mockGithubService.getUserFollowersAndFollowing.mockRejectedValue(error);

      await expect(
        service.getFollowersAndFollowing('testuser'),
      ).rejects.toThrow(InternalServerErrorException);

      expect(Logger.prototype.error).toHaveBeenCalledWith(
        'Error fetching followers and following:',
        'GitHub API error',
      );
    });
  });

  describe('getUserProfile', () => {
    it('should return user profile on success', async () => {
      const profile = { login: 'testuser', avatar_url: 'url' };
      mockGithubService.getPublicUserProfile.mockResolvedValue(profile);
      const result = await service.getUserProfile('testuser');
      expect(result).toEqual(profile);
    });

    it('should throw InternalServerErrorException and log on failure', async () => {
      const error = new Error('GitHub API error');
      mockGithubService.getPublicUserProfile.mockRejectedValue(error);

      await expect(service.getUserProfile('testuser')).rejects.toThrow(
        InternalServerErrorException,
      );

      expect(Logger.prototype.error).toHaveBeenCalledWith(
        'Error fetching user profile:',
        'GitHub API error',
      );
    });
  });
});

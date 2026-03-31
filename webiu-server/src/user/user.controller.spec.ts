import { Test, TestingModule } from '@nestjs/testing';
import { UserController } from './user.controller';
import { UserService } from './user.service';

describe('UserController', () => {
  let controller: UserController;

  const mockUserService = {
    getFollowersAndFollowing: jest.fn(),
    batchFollowersAndFollowing: jest.fn(),
    getUserProfile: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserController],
      providers: [
        { provide: UserService, useValue: mockUserService },
      ],
    }).compile();

    controller = module.get<UserController>(UserController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getFollowersAndFollowing', () => {
    it('should return followers and following', async () => {
      mockUserService.getFollowersAndFollowing.mockResolvedValue({
        followers: 100,
        following: 50,
      });

      const result =
        await controller.getFollowersAndFollowing('testuser');

      expect(result).toEqual({ followers: 100, following: 50 });
      expect(
        mockUserService.getFollowersAndFollowing,
      ).toHaveBeenCalledWith('testuser');
    });
  });

  describe('batchSocial', () => {
    it('should return batch results', async () => {
      mockUserService.batchFollowersAndFollowing.mockResolvedValue({
        user1: { followers: 10, following: 5 },
      });

      const result = await controller.batchSocial({
        usernames: ['user1'],
      });

      expect(result).toEqual({
        user1: { followers: 10, following: 5 },
      });
      expect(
        mockUserService.batchFollowersAndFollowing,
      ).toHaveBeenCalledWith(['user1']);
    });
  });

  describe('getUserProfile', () => {
    it('should return user profile', async () => {
      const mockProfile = {
        login: 'testuser',
        avatar_url: 'url',
      };

      mockUserService.getUserProfile.mockResolvedValue(mockProfile);

      const result = await controller.getUserProfile('testuser');

      expect(result).toEqual(mockProfile);
      expect(mockUserService.getUserProfile).toHaveBeenCalledWith(
        'testuser',
      );
    });
  });
});
import { Test, TestingModule } from '@nestjs/testing';
import { UserController } from './user.controller';
import { UserService } from './user.service';

describe('UserController', () => {
  let controller: UserController;

  const mockUserService = {
    getFollowersAndFollowing: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserController],
      providers: [{ provide: UserService, useValue: mockUserService }],
    }).compile();

    controller = module.get<UserController>(UserController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getFollowersAndFollowing', () => {
    it('should call userService with the username', async () => {
      const mockResult = { 0: 0 };
      mockUserService.getFollowersAndFollowing.mockResolvedValue(mockResult);

      const result = await controller.getFollowersAndFollowing('testuser');

      expect(result).toEqual(mockResult);
      expect(mockUserService.getFollowersAndFollowing).toHaveBeenCalledWith(
        'testuser',
      );
    });
  });
});

import { Test, TestingModule } from '@nestjs/testing';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { GithubService } from '../github/github.service';

describe('UserController', () => {
  let controller: UserController;

  const mockGithubService = {
    getPublicUserProfile: jest.fn(),
    getUserFollowersAndFollowing: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserController],
      providers: [
        UserService,
        { provide: GithubService, useValue: mockGithubService },
      ],
    }).compile();

    controller = module.get<UserController>(UserController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});

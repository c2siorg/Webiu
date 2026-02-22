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

  it('should call getUserFollowersAndFollowing with the correct username', async () => {
    const mockData = { followers: 10, following: 5 };
    mockGithubService.getUserFollowersAndFollowing.mockResolvedValue(mockData);

    const result = await service.getFollowersAndFollowing('testuser');

    expect(mockGithubService.getUserFollowersAndFollowing).toHaveBeenCalledWith(
      'testuser',
    );
    expect(result).toEqual(mockData);
  });
});

import { Test, TestingModule } from '@nestjs/testing';
import { UserService } from './user.service';

describe('UserService', () => {
  let service: UserService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [UserService],
    }).compile();

    service = module.get<UserService>(UserService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getFollowersAndFollowing', () => {
    it('should return placeholder data', async () => {
      const result = await service.getFollowersAndFollowing('testuser');
      expect(result).toEqual({ 0: 0 });
    });

    it('should return the same result regardless of username', async () => {
      const result1 = await service.getFollowersAndFollowing('user1');
      const result2 = await service.getFollowersAndFollowing('user2');
      expect(result1).toEqual(result2);
    });
  });
});

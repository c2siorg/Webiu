import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { UserModule } from './user.module';
import { UserService } from './user.service';
import { GithubService } from '../github/github.service';

describe('UserController (Validation)', () => {
  let app: INestApplication;
  const mockUserService = {
    getFollowersAndFollowing: jest.fn(),
    getUserProfile: jest.fn(),
  };
  const mockGithubService = {};

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [UserModule],
    })
      .overrideProvider(UserService)
      .useValue(mockUserService)
      .overrideProvider(GithubService)
      .useValue(mockGithubService)
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
      }),
    );
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('GET /api/v1/user/followersAndFollowing/:username', () => {
    it('should return 200 for valid username', () => {
      mockUserService.getFollowersAndFollowing.mockReturnValue({
        followers: [],
        following: [],
      });
      return request(app.getHttpServer())
        .get('/api/v1/user/followersAndFollowing/valid-user_123')
        .expect(200);
    });

    it('should return 400 for username with special characters', () => {
      return request(app.getHttpServer())
        .get('/api/v1/user/followersAndFollowing/invalid@user')
        .expect(400)
        .expect((res) => {
          expect(res.body.message).toContain(
            'Username can only contain letters, numbers, hyphens, and underscores',
          );
        });
    });

    it('should return 400 for too long username', () => {
      return request(app.getHttpServer())
        .get('/api/v1/user/followersAndFollowing/' + 'a'.repeat(40))
        .expect(400)
        .expect((res) => {
          expect(res.body.message).toContain(
            'Username cannot exceed 39 characters (GitHub limit)',
          );
        });
    });
  });

  describe('GET /api/v1/user/profile/:username', () => {
    it('should return 200 for valid username', () => {
      mockUserService.getUserProfile.mockReturnValue({ name: 'Valid User' });
      return request(app.getHttpServer())
        .get('/api/v1/user/profile/valid-user')
        .expect(200);
    });

    it('should return 400 for invalid username', () => {
      return request(app.getHttpServer())
        .get('/api/v1/user/profile/invalid.user')
        .expect(400);
    });
  });
});

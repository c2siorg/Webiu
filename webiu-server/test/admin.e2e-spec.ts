import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { AdminService } from '../src/admin/admin.service';

describe('Admin API Authz (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    process.env.JWT_SECRET = 'test-secret';
    process.env.AUTH_REQUIRE_EMAIL_VERIFICATION = 'false';

    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(AdminService)
      .useValue({
        getDashboard: jest.fn().mockResolvedValue({
          generatedAt: new Date().toISOString(),
          stats: [{ label: 'Registered Users', value: 2 }],
          recentActivity: [],
        }),
      })
      .compile();

    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  async function login(email: string, password: string) {
    const response = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email, password });

    return response.body.accessToken as string;
  }

  it('returns 401 when token is missing', async () => {
    await request(app.getHttpServer())
      .get('/api/v1/admin/dashboard')
      .expect(401);
  });

  it('returns 403 for non-admin user token', async () => {
    await request(app.getHttpServer()).post('/api/v1/auth/register').send({
      name: 'Normal User',
      email: 'user@example.com',
      password: 'password123',
      confirmPassword: 'password123',
    });

    const userToken = await login('user@example.com', 'password123');

    await request(app.getHttpServer())
      .get('/api/v1/admin/dashboard')
      .set('Authorization', `Bearer ${userToken}`)
      .expect(403);
  });

  it('returns 200 for seeded admin token', async () => {
    const adminToken = await login('admin@webiu.local', 'admin123');

    const response = await request(app.getHttpServer())
      .get('/api/v1/admin/dashboard')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    expect(response.body).toHaveProperty('generatedAt');
    expect(response.body).toHaveProperty('stats');
  });
});

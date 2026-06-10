import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Response, Request } from 'express';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: AuthService;
  let jwtService: JwtService;

  const mockResponse = () => {
    const res = {} as Response;
    res.cookie = jest.fn().mockReturnValue(res);
    res.clearCookie = jest.fn().mockReturnValue(res);
    return res;
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: {
            login: jest.fn().mockResolvedValue('mock-jwt-token'),
          },
        },
        {
          provide: JwtService,
          useValue: {
            verify: jest.fn().mockReturnValue({ username: 'admin' }),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              if (key === 'ADMIN_USERNAME') return 'admin';
              if (key === 'NODE_ENV') return 'development';
              return null;
            }),
          },
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get<AuthService>(AuthService);
    jwtService = module.get<JwtService>(JwtService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('login', () => {
    it('should set httpOnly cookie with JWT and return success', async () => {
      const loginDto: LoginDto = {
        username: 'admin',
        password: 'secure-password',
      };
      const res = mockResponse();

      const result = await controller.login(loginDto, res);

      expect(authService.login).toHaveBeenCalledWith(loginDto);
      expect(res.cookie).toHaveBeenCalledWith(
        'admin_session',
        'mock-jwt-token',
        {
          httpOnly: true,
          secure: false,
          sameSite: 'lax',
          path: '/',
          maxAge: 3600 * 1000,
        },
      );
      expect(result).toEqual({ success: true });
    });
  });

  describe('logout', () => {
    it('should clear httpOnly session cookie and return success', async () => {
      const res = mockResponse();

      const result = await controller.logout(res);

      expect(res.clearCookie).toHaveBeenCalledWith('admin_session', {
        httpOnly: true,
        secure: false,
        sameSite: 'lax',
        path: '/',
      });
      expect(result).toEqual({ success: true });
    });
  });

  describe('checkSession', () => {
    it('should return authenticated true if cookie contains valid token matching ADMIN_USERNAME', async () => {
      const req = {
        headers: {
          cookie: 'admin_session=valid-jwt-token',
        },
      } as Request;

      const result = await controller.checkSession(req);

      expect(jwtService.verify).toHaveBeenCalledWith('valid-jwt-token');
      expect(result).toEqual({ authenticated: true });
    });

    it('should return authenticated false if admin_session cookie is missing', async () => {
      const req = {
        headers: {
          cookie: 'other_cookie=xyz',
        },
      } as Request;

      const result = await controller.checkSession(req);

      expect(result).toEqual({ authenticated: false });
    });

    it('should return authenticated false if token verification fails', async () => {
      const req = {
        headers: {
          cookie: 'admin_session=invalid-jwt-token',
        },
      } as Request;
      (jwtService.verify as jest.Mock).mockImplementation(() => {
        throw new Error('Invalid token');
      });

      const result = await controller.checkSession(req);

      expect(result).toEqual({ authenticated: false });
    });
  });
});

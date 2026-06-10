import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { CredentialService } from './credential.service';
import { LoginDto } from './dto/login.dto';

describe('AuthService', () => {
  let service: AuthService;
  let credentialService: CredentialService;
  let jwtService: JwtService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: CredentialService,
          useValue: {
            validateCredentials: jest.fn(),
          },
        },
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn().mockReturnValue('mock-jwt-token'),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    credentialService = module.get<CredentialService>(CredentialService);
    jwtService = module.get<JwtService>(JwtService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('login', () => {
    it('should return a JWT token if credentials are valid', async () => {
      const loginDto: LoginDto = {
        username: 'admin',
        password: 'secure-password',
      };
      (credentialService.validateCredentials as jest.Mock).mockResolvedValue(
        true,
      );

      const result = await service.login(loginDto);

      expect(result).toBe('mock-jwt-token');
      expect(credentialService.validateCredentials).toHaveBeenCalledWith(
        'admin',
        'secure-password',
      );
      expect(jwtService.sign).toHaveBeenCalledWith({
        username: 'admin',
        role: 'admin',
      });
    });

    it('should throw UnauthorizedException if credentials are invalid', async () => {
      const loginDto: LoginDto = {
        username: 'admin',
        password: 'wrong-password',
      };
      (credentialService.validateCredentials as jest.Mock).mockResolvedValue(
        false,
      );

      await expect(service.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
      expect(credentialService.validateCredentials).toHaveBeenCalledWith(
        'admin',
        'wrong-password',
      );
    });
  });
});

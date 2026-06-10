import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { CredentialService } from './credential.service';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly credentialService: CredentialService,
  ) {}

  async login(loginDto: LoginDto): Promise<string> {
    const isValid = await this.credentialService.validateCredentials(
      loginDto.username,
      loginDto.password,
    );

    if (!isValid) {
      throw new UnauthorizedException('Invalid administrator credentials');
    }

    const payload = { username: loginDto.username, role: 'admin' };
    return this.jwtService.sign(payload);
  }
}

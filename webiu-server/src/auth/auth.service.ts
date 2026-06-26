import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Admin } from '../database/entities/admin.entity';
import { CredentialService } from './credential.service';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly credentialService: CredentialService,
    @InjectRepository(Admin)
    private readonly adminRepository: Repository<Admin>,
  ) {}

  async login(loginDto: LoginDto): Promise<string> {
    const isValid = await this.credentialService.validateCredentials(
      loginDto.username,
      loginDto.password,
    );

    if (!isValid) {
      throw new UnauthorizedException('Invalid administrator credentials');
    }

    const admin = await this.adminRepository.findOne({
      where: { username: loginDto.username },
    });

    const payload = {
      username: loginDto.username,
      role: 'admin',
      tokenVersion: admin ? admin.tokenVersion : 1,
    };
    return this.jwtService.sign(payload);
  }
}

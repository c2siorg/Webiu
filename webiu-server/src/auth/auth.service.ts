import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
  NotImplementedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { EmailService } from '../email/email.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
    private emailService: EmailService,
  ) {}

  // TODO: Re-enable when MongoDB is connected
  async register(registerDto: RegisterDto) {
    throw new NotImplementedException(
      'Registration requires MongoDB. Connect a database to enable this feature.',
    );
  }

  async login(loginDto: LoginDto) {
    throw new NotImplementedException(
      'Login requires MongoDB. Connect a database to enable this feature.',
    );
  }

  async verifyEmail(token: string) {
    throw new NotImplementedException(
      'Email verification requires MongoDB. Connect a database to enable this feature.',
    );
  }
}

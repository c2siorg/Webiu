import { Injectable, NotImplementedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { EmailService } from '../email/email.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { UserRole } from '../user/schemas/user.schema';

export interface JwtPayload {
  id: string;
  email: string;
  role: UserRole;
}

export interface AuthResponse {
  access_token: string;
  user: {
    id: string;
    email: string;
    name: string;
    role: UserRole;
  };
}

@Injectable()
export class AuthService {
  constructor(
    private _jwtService: JwtService,
    private _emailService: EmailService,
  ) {}

  /**
   * Generate JWT token with role information
   * @param user User object with id, email, name, and role
   * @returns JWT access token
   */
  generateToken(user: {
    id: string;
    email: string;
    name: string;
    role: UserRole;
  }): string {
    const payload: JwtPayload = {
      id: user.id,
      email: user.email,
      role: user.role,
    };

    return this._jwtService.sign(payload);
  }

  /**
   * Validate JWT token and extract user information
   * @param token JWT token
   * @returns Decoded token payload
   */
  validateToken(token: string): JwtPayload {
    try {
      return this._jwtService.verify<JwtPayload>(token);
    } catch (error) {
      throw new Error('Invalid or expired token');
    }
  }

  // TODO: Re-enable when MongoDB is connected
  async register(_registerDto: RegisterDto) {
    throw new NotImplementedException(
      'Registration requires MongoDB. Connect a database to enable this feature.',
    );
  }

  async login(_loginDto: LoginDto) {
    throw new NotImplementedException(
      'Login requires MongoDB. Connect a database to enable this feature.',
    );
  }

  async verifyEmail(_token: string) {
    throw new NotImplementedException(
      'Email verification requires MongoDB. Connect a database to enable this feature.',
    );
  }
}

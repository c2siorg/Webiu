import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { compare, hash, hashSync } from 'bcryptjs';
import { randomBytes, randomUUID } from 'crypto';
import { EmailService } from '../email/email.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

type UserRole = 'admin' | 'user';

interface AuthUser {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  isEmailVerified: boolean;
  role: UserRole;
}

interface AuthPayload {
  sub: string;
  email: string;
  name: string;
  role: UserRole;
}

@Injectable()
export class AuthService {
  private usersByEmail = new Map<string, AuthUser>();
  private verificationTokens = new Map<string, string>();

  constructor(
    private jwtService: JwtService,
    private emailService: EmailService,
    private configService: ConfigService,
  ) {
    this.seedAdminUser();
  }

  private async sendVerificationEmail(email: string, token: string) {
    await this.emailService.sendVerificationEmail(email, token);
  }

  private getBaseUrl(): string {
    return this.configService.get<string>(
      'FRONTEND_BASE_URL',
      'http://localhost:4200',
    );
  }

  private shouldRequireEmailVerification(): boolean {
    return this.configService.get<string>('AUTH_REQUIRE_EMAIL_VERIFICATION') === 'true';
  }

  private sanitizeUser(user: AuthUser) {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      isEmailVerified: user.isEmailVerified,
    };
  }

  private issueToken(user: AuthUser) {
    const payload: AuthPayload = {
      sub: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    };

    return this.jwtService.sign(payload);
  }

  private buildAuthResponse(user: AuthUser) {
    return {
      accessToken: this.issueToken(user),
      tokenType: 'Bearer',
      expiresInSeconds: 3600,
      user: this.sanitizeUser(user),
    };
  }

  private seedAdminUser() {
    const adminEmail = this.configService.get<string>(
      'ADMIN_EMAIL',
      'admin@webiu.local',
    );
    const normalizedEmail = adminEmail.trim().toLowerCase();
    if (this.usersByEmail.has(normalizedEmail)) {
      return;
    }

    const adminPassword = this.configService.get<string>(
      'ADMIN_PASSWORD',
      'admin123',
    );
    const adminName = this.configService.get<string>('ADMIN_NAME', 'WebIU Admin');

    const passwordHash = hashSync(adminPassword, 10);
    this.usersByEmail.set(normalizedEmail, {
      id: randomUUID(),
      name: adminName,
      email: normalizedEmail,
      passwordHash,
      isEmailVerified: true,
      role: 'admin',
    });
  }

  async register(registerDto: RegisterDto) {
    const normalizedEmail = registerDto.email.trim().toLowerCase();

    if (registerDto.password !== registerDto.confirmPassword) {
      throw new BadRequestException('Passwords do not match');
    }

    if (this.usersByEmail.has(normalizedEmail)) {
      throw new ConflictException('A user with this email already exists');
    }

    const isEmailVerified = !this.shouldRequireEmailVerification();
    const passwordHash = await hash(registerDto.password, 10);

    const user: AuthUser = {
      id: randomUUID(),
      name: registerDto.name.trim(),
      email: normalizedEmail,
      passwordHash,
      isEmailVerified,
      role: 'user',
    };

    this.usersByEmail.set(normalizedEmail, user);

    const response: Record<string, unknown> = {
      message: isEmailVerified
        ? 'Registration successful'
        : 'Registration successful. Please verify your email before login.',
      user: this.sanitizeUser(user),
    };

    if (!isEmailVerified) {
      const verificationToken = randomBytes(24).toString('hex');
      this.verificationTokens.set(verificationToken, normalizedEmail);
      const verificationLink = `${this.getBaseUrl()}/auth/verify-email?token=${verificationToken}`;

      try {
        await this.sendVerificationEmail(normalizedEmail, verificationLink);
      } catch {
        // Email can be unavailable in local/dev mode. Keep registration successful.
      }

      if (this.configService.get<string>('NODE_ENV') !== 'production') {
        response.verificationToken = verificationToken;
      }
    }

    return response;
  }

  async login(loginDto: LoginDto) {
    const normalizedEmail = loginDto.email.trim().toLowerCase();
    const user = this.usersByEmail.get(normalizedEmail);

    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const isPasswordValid = await compare(loginDto.password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    if (!user.isEmailVerified) {
      throw new UnauthorizedException('Please verify your email before login');
    }

    return this.buildAuthResponse(user);
  }

  async verifyEmail(token: string) {
    const email = this.verificationTokens.get(token);
    if (!email) {
      throw new NotFoundException('Invalid or expired verification token');
    }

    const user = this.usersByEmail.get(email);
    if (!user) {
      throw new NotFoundException('User not found for this token');
    }

    user.isEmailVerified = true;
    this.usersByEmail.set(email, user);
    this.verificationTokens.delete(token);

    return {
      message: 'Email verified successfully',
      user: this.sanitizeUser(user),
    };
  }

  async getProfile(authUser: AuthPayload) {
    if (!authUser?.email) {
      throw new UnauthorizedException('Invalid token payload');
    }

    const user = this.usersByEmail.get(authUser.email.toLowerCase());
    if (!user) {
      throw new NotFoundException('User not found');
    }

    return this.sanitizeUser(user);
  }

  getUserCount(): number {
    return this.usersByEmail.size;
  }
}

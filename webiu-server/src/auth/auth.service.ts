import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { JwtService } from '@nestjs/jwt';
import { randomBytes } from 'crypto';
import { EmailService } from '../email/email.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { User, UserDocument } from '../user/schemas/user.schema';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private jwtService: JwtService,
    private emailService: EmailService,
  ) {}

  async register(registerDto: RegisterDto) {
    const { name, email, password, confirmPassword, githubId } = registerDto;

    if (password !== confirmPassword) {
      throw new BadRequestException('Passwords do not match');
    }

    const existingUser = await this.userModel.findOne({ email }).exec();
    if (existingUser) {
      throw new ConflictException('Email already registered');
    }

    const verificationToken = randomBytes(32).toString('hex');

    const user = new this.userModel({
      name,
      email,
      password,
      githubId,
      verificationToken,
      isVerified: false,
    });
    await user.save();

    try {
      await this.emailService.sendVerificationEmail(email, verificationToken);
    } catch {
      /* email delivery is best-effort; user can request resend */
    }

    return { message: 'Registration successful. Please verify your email.' };
  }

  async login(loginDto: LoginDto) {
    const { email, password } = loginDto;

    const user = await this.userModel.findOne({ email }).exec();
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.isVerified) {
      throw new UnauthorizedException('Please verify your email before logging in');
    }

    const payload = { id: (user as any)._id.toString(), email: user.email };
    const token = this.jwtService.sign(payload);

    return { accessToken: token };
  }

  async verifyEmail(token: string) {
    if (!token) {
      throw new BadRequestException('Verification token is required');
    }

    const user = await this.userModel
      .findOne({ verificationToken: token })
      .exec();
    if (!user) {
      throw new BadRequestException('Invalid or expired verification token');
    }

    user.isVerified = true;
    user.verificationToken = '';
    await user.save();

    return { message: 'Email verified successfully' };
  }
}

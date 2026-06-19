import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { Admin } from '../database/entities/admin.entity';
import { UpdatePasswordDto } from './dto/update-password.dto';

@Injectable()
export class AdminProfileService {
  constructor(
    @InjectRepository(Admin)
    private readonly adminRepository: Repository<Admin>,
  ) {}

  async getProfile(username: string): Promise<Admin> {
    const admin = await this.adminRepository.findOne({
      where: { username },
    });

    if (!admin) {
      throw new NotFoundException('Administrator profile not found.');
    }

    return admin;
  }

  async updateUsername(
    currentUsername: string,
    newUsername: string,
  ): Promise<Admin> {
    const trimmed = newUsername.trim();

    // Ensure uniqueness
    if (trimmed !== currentUsername) {
      const existing = await this.adminRepository.findOne({
        where: { username: trimmed },
      });
      if (existing) {
        throw new BadRequestException('Username is already taken.');
      }
    }

    const admin = await this.getProfile(currentUsername);
    admin.username = trimmed;
    return this.adminRepository.save(admin);
  }

  async updatePassword(
    username: string,
    dto: UpdatePasswordDto,
  ): Promise<void> {
    const { currentPassword, newPassword, confirmPassword } = dto;

    if (newPassword !== confirmPassword) {
      throw new BadRequestException(
        'New password and confirm password do not match.',
      );
    }

    const admin = await this.getProfile(username);

    const isMatch = await bcrypt.compare(currentPassword, admin.passwordHash);
    if (!isMatch) {
      throw new BadRequestException('Current password verification failed.');
    }

    const isSamePassword = await bcrypt.compare(
      newPassword,
      admin.passwordHash,
    );
    if (isSamePassword) {
      throw new BadRequestException(
        'New password cannot be the same as the current password.',
      );
    }

    admin.passwordHash = await bcrypt.hash(newPassword, 10);
    await this.adminRepository.save(admin);
  }
}

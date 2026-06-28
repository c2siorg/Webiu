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
import { AuditLogService } from '../audit-log/audit-log.service';

@Injectable()
export class AdminProfileService {
  constructor(
    @InjectRepository(Admin)
    private readonly adminRepository: Repository<Admin>,
    private readonly auditLogService: AuditLogService,
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
    adminId?: string,
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
    const oldUsername = admin.username;
    admin.username = trimmed;
    admin.tokenVersion = (admin.tokenVersion || 1) + 1;

    let savedAdmin: Admin;
    try {
      savedAdmin = await this.adminRepository.save(admin);
    } catch (err: any) {
      if (
        err?.code === '23505' ||
        err?.message?.includes('unique') ||
        err?.message?.includes('UNIQUE') ||
        err?.message?.includes('duplicate key')
      ) {
        throw new BadRequestException('Username is already taken.');
      }
      throw err;
    }

    if (adminId) {
      await this.auditLogService.createLog({
        adminId,
        action: 'USERNAME_CHANGED',
        entityType: 'profile',
        entityId: admin.id,
        oldValue: JSON.stringify({ username: oldUsername }),
        newValue: JSON.stringify({ username: trimmed }),
      });
    }

    return savedAdmin;
  }

  async updatePassword(
    username: string,
    dto: UpdatePasswordDto,
    adminId?: string,
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
    admin.tokenVersion = (admin.tokenVersion || 1) + 1;
    await this.adminRepository.save(admin);

    if (adminId) {
      await this.auditLogService.createLog({
        adminId,
        action: 'PASSWORD_CHANGED',
        entityType: 'profile',
        entityId: admin.id,
        oldValue: '********',
        newValue: '********',
      });
    }
  }
}

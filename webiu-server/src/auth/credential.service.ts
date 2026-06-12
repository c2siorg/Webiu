import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { Admin } from '../database/entities/admin.entity';

@Injectable()
export class CredentialService {
  constructor(
    @InjectRepository(Admin)
    private readonly adminRepository: Repository<Admin>,
  ) {}

  /**
   * Validates administrator credentials against the database.
   */
  async validateCredentials(
    username: string,
    password: string,
  ): Promise<boolean> {
    const admin = await this.adminRepository.findOne({
      where: { username },
    });

    if (!admin) {
      return false;
    }

    const isMatch = await bcrypt.compare(password, admin.passwordHash);

    if (isMatch) {
      admin.lastLoginAt = new Date();
      await this.adminRepository.save(admin);
    }

    return isMatch;
  }
}

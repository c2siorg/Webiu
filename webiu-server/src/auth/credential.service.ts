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
      // Execute dummy bcrypt check to equalize timing profile (approx 80-100ms)
      const dummyHash =
        '$2b$10$s7v7P6yP0d7HUX7p5xP6uO5i2Zf9c0Z2O5eW8p3k8p5p5p5p5p5p5';
      await bcrypt.compare(password, dummyHash);
      return false;
    }

    const isMatch = await bcrypt.compare(password, admin.passwordHash);

    if (isMatch) {
      const lastLoginAt = new Date();
      await this.adminRepository.update(admin.id, { lastLoginAt });
      admin.lastLoginAt = lastLoginAt;
    }

    return isMatch;
  }
}

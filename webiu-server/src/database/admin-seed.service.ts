import { Injectable, OnApplicationBootstrap, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import { Admin } from './entities/admin.entity';

@Injectable()
export class AdminSeedService implements OnApplicationBootstrap {
  private readonly logger = new Logger(AdminSeedService.name);

  constructor(
    @InjectRepository(Admin)
    private readonly adminRepository: Repository<Admin>,
    private readonly configService: ConfigService,
  ) {}

  async onApplicationBootstrap() {
    this.logger.log('Checking if administrator initialization is required...');
    const adminCount = await this.adminRepository.count();

    if (adminCount === 0) {
      this.logger.log('No administrator found. Seeding initial admin...');

      const username = this.configService.get<string>('ADMIN_USERNAME');
      const password = this.configService.get<string>('ADMIN_PASSWORD');

      if (!username || !password) {
        this.logger.error(
          'Failed to seed initial admin: ADMIN_USERNAME or ADMIN_PASSWORD not configured in environment',
        );
        return;
      }

      const passwordHash = await bcrypt.hash(password, 10);
      const admin = this.adminRepository.create({
        username,
        passwordHash,
      });

      await this.adminRepository.save(admin);
      this.logger.log(
        `Initial administrator "${username}" seeded successfully.`,
      );
    } else {
      this.logger.log('Administrator account already exists in database.');
    }
  }
}

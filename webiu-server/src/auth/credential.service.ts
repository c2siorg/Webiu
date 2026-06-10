import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class CredentialService {
  constructor(private readonly configService: ConfigService) {}

  /**
   * Validates administrator credentials against ConfigService (env variables).
   * Decoupled to allow drop-in replacement when migrating to a database later.
   */
  async validateCredentials(
    username: string,
    password: string,
  ): Promise<boolean> {
    const adminUser = this.configService.get<string>('ADMIN_USERNAME');
    const adminPass = this.configService.get<string>('ADMIN_PASSWORD');

    // Return false if either environment variable is unconfigured
    if (!adminUser || !adminPass) {
      return false;
    }

    return username === adminUser && password === adminPass;
  }
}

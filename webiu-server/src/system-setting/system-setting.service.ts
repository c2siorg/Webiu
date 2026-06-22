import {
  Injectable,
  OnApplicationBootstrap,
  Logger,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SystemSetting } from '../database/entities/system-setting.entity';
import { AuditLogService } from '../audit-log/audit-log.service';

const DEFAULT_SETTINGS: Record<string, string> = {
  'gsoc.current_year': '2026',
  'gsoc.show_ideas_page': 'true',
  'gsoc.registration_open': 'true',
  'site.title': 'WebiU',
  'site.description': 'WebiU - GSOC Portal',
  'site.maintenance_mode': 'false',
};

@Injectable()
export class SystemSettingService implements OnApplicationBootstrap {
  private readonly logger = new Logger(SystemSettingService.name);

  constructor(
    @InjectRepository(SystemSetting)
    private readonly settingRepository: Repository<SystemSetting>,
    private readonly auditLogService: AuditLogService,
  ) {}

  async onApplicationBootstrap() {
    this.logger.log('Initializing and seeding default system settings...');
    try {
      for (const [key, defaultValue] of Object.entries(DEFAULT_SETTINGS)) {
        const existing = await this.settingRepository.findOne({
          where: { key },
        });
        if (!existing) {
          const setting = this.settingRepository.create({
            key,
            value: defaultValue,
          });
          await this.settingRepository.save(setting);
          this.logger.log(`Seeded default setting: ${key} = ${defaultValue}`);
        }
      }
      this.logger.log('System settings initialization completed.');
    } catch (error) {
      this.logger.error('Failed to initialize system settings:', error.message);
    }
  }

  async getSetting(key: string): Promise<string> {
    const setting = await this.settingRepository.findOne({ where: { key } });
    if (setting) {
      return setting.value;
    }
    const defaultValue = DEFAULT_SETTINGS[key];
    if (defaultValue !== undefined) {
      return defaultValue;
    }
    throw new NotFoundException(`Setting with key "${key}" not found.`);
  }

  async getSettingBool(key: string): Promise<boolean> {
    const value = await this.getSetting(key);
    return value === 'true';
  }

  async getSettingNumber(key: string): Promise<number> {
    const value = await this.getSetting(key);
    const parsed = parseInt(value, 10);
    if (isNaN(parsed)) {
      throw new BadRequestException(
        `Setting "${key}" value "${value}" is not a valid number.`,
      );
    }
    return parsed;
  }

  async getAllSettings(): Promise<Record<string, string | boolean | number>> {
    const settings = await this.settingRepository.find();
    const result: Record<string, string | boolean | number> = {};

    // Load all defined keys from defaults first to ensure they exist in output
    for (const key of Object.keys(DEFAULT_SETTINGS)) {
      const dbSetting = settings.find((s) => s.key === key);
      const strValue = dbSetting ? dbSetting.value : DEFAULT_SETTINGS[key];
      result[key] = this.parseValue(key, strValue);
    }

    return result;
  }

  async updateSettings(
    updates: Record<string, string | boolean | number>,
    adminId?: string,
  ): Promise<Record<string, string | boolean | number>> {
    this.logger.log(`Updating system settings: ${JSON.stringify(updates)}`);

    for (const [key, value] of Object.entries(updates)) {
      if (DEFAULT_SETTINGS[key] === undefined) {
        throw new BadRequestException(`Unsupported setting key "${key}".`);
      }
      this.validateSetting(key, value);
    }

    const oldSettings = await this.getAllSettings();

    for (const [key, value] of Object.entries(updates)) {
      let setting = await this.settingRepository.findOne({ where: { key } });
      const stringValue = String(value);

      const oldVal = oldSettings[key];
      const newVal = this.parseValue(key, stringValue);

      if (String(oldVal) !== stringValue) {
        if (!setting) {
          setting = this.settingRepository.create({ key, value: stringValue });
        } else {
          setting.value = stringValue;
        }
        await this.settingRepository.save(setting);

        // Audit setting update
        if (adminId) {
          await this.auditLogService.createLog({
            adminId,
            action: 'SETTING_UPDATED',
            entityType: 'settings',
            entityId: key,
            oldValue: String(oldVal),
            newValue: String(newVal),
          });
        }
      }
    }

    return this.getAllSettings();
  }

  private parseValue(key: string, value: string): string | boolean | number {
    if (key === 'gsoc.current_year') {
      return parseInt(value, 10) || 2026;
    }
    if (
      key === 'gsoc.show_ideas_page' ||
      key === 'gsoc.registration_open' ||
      key === 'site.maintenance_mode'
    ) {
      return value === 'true';
    }
    return value;
  }

  private validateSetting(key: string, value: any): void {
    if (key === 'gsoc.current_year') {
      const num = Number(value);
      if (!Number.isInteger(num) || num < 2000 || num > 2100) {
        throw new BadRequestException(
          'GSoC current year must be an integer between 2000 and 2100.',
        );
      }
    } else if (
      key === 'gsoc.show_ideas_page' ||
      key === 'gsoc.registration_open' ||
      key === 'site.maintenance_mode'
    ) {
      if (typeof value !== 'boolean' && value !== 'true' && value !== 'false') {
        throw new BadRequestException(`Setting "${key}" must be a boolean.`);
      }
    } else if (key === 'site.title') {
      if (typeof value !== 'string' || value.trim().length === 0) {
        throw new BadRequestException('Site title cannot be empty.');
      }
    } else if (key === 'site.description') {
      if (typeof value !== 'string') {
        throw new BadRequestException('Site description must be a string.');
      }
    }
  }
}

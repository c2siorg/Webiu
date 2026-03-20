import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class PersistenceService implements OnModuleInit {
  private readonly logger = new Logger(PersistenceService.name);
  private readonly persistenceDir = path.join(process.cwd(), 'persistence');

  onModuleInit() {
    if (!fs.existsSync(this.persistenceDir)) {
      fs.mkdirSync(this.persistenceDir, { recursive: true });
      this.logger.log(
        `Created persistence directory at ${this.persistenceDir}`,
      );
    }
  }

  private getFilePath(key: string): string {
    // Sanitize key to be used as filename
    const safeKey = key.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    return path.join(this.persistenceDir, `${safeKey}.json`);
  }

  async save(key: string, data: any): Promise<void> {
    try {
      const filePath = this.getFilePath(key);
      const payload = JSON.stringify(
        {
          key,
          data,
          updatedAt: new Date().toISOString(),
        },
        null,
        2,
      );
      await fs.promises.writeFile(filePath, payload, 'utf8');
    } catch (error) {
      this.logger.error(
        `Failed to save persistence for key ${key}: ${error.message}`,
      );
    }
  }

  async load(key: string): Promise<any | null> {
    try {
      const filePath = this.getFilePath(key);
      if (fs.existsSync(filePath)) {
        const content = await fs.promises.readFile(filePath, 'utf8');
        const parsed = JSON.parse(content);
        return parsed.data;
      }
    } catch (error) {
      this.logger.error(
        `Failed to load persistence for key ${key}: ${error.message}`,
      );
    }
    return null;
  }
}

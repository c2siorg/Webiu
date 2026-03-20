import { Module, Global } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CacheService } from './cache.service';
import { PersistenceService } from './persistence.service';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [CacheService, PersistenceService],
  exports: [CacheService, PersistenceService],
})
export class CommonModule {}

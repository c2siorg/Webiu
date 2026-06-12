import { Module, Global } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Admin } from './entities/admin.entity';
import { SystemSetting } from './entities/system-setting.entity';
import { AdminSeedService } from './admin-seed.service';

@Global()
@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        url: configService.get<string>('DATABASE_URL'),
        ssl:
          configService.get<string>('DATABASE_URL')?.includes('render.com') ||
          configService.get<string>('NODE_ENV') === 'production'
            ? { rejectUnauthorized: false }
            : false,
        entities: [Admin, SystemSetting],
        synchronize: false,
      }),
      inject: [ConfigService],
    }),
    TypeOrmModule.forFeature([Admin, SystemSetting]),
  ],
  providers: [AdminSeedService],
  exports: [TypeOrmModule],
})
export class DatabaseModule {}

import { Module, Global } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Admin } from './entities/admin.entity';
import { SystemSetting } from './entities/system-setting.entity';
import { Repository as RepositoryEntity } from './entities/repository.entity';
import { Contributor } from './entities/contributor.entity';
import { RepositoryContributor } from './entities/repository-contributor.entity';
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
          configService.get<string>('DATABASE_SSL') === 'true'
            ? { rejectUnauthorized: false }
            : false,
        entities: [
          Admin,
          SystemSetting,
          RepositoryEntity,
          Contributor,
          RepositoryContributor,
        ],
        synchronize: false,
      }),
      inject: [ConfigService],
    }),
    TypeOrmModule.forFeature([
      Admin,
      SystemSetting,
      RepositoryEntity,
      Contributor,
      RepositoryContributor,
    ]),
  ],
  providers: [AdminSeedService],
  exports: [TypeOrmModule],
})
export class DatabaseModule {}

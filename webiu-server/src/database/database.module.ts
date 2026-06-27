import { Module, Global } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Admin } from './entities/admin.entity';
import { SystemSetting } from './entities/system-setting.entity';
import { Repository as RepositoryEntity } from './entities/repository.entity';
import { Contributor } from './entities/contributor.entity';
import { RepositoryContributor } from './entities/repository-contributor.entity';
import { GsocProgram } from './entities/gsoc-program.entity';
import { GsocIdea } from './entities/gsoc-idea.entity';
import { GsocMentor } from './entities/gsoc-mentor.entity';
import { AuditLog } from './entities/audit-log.entity';
import { AdminSeedService } from './admin-seed.service';
import { getSSLConfig } from './ssl.config';

@Global()
@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        url: configService.get<string>('DATABASE_URL'),
        ssl: getSSLConfig({
          databaseUrl: configService.get<string>('DATABASE_URL'),
          databaseSsl: configService.get<string>('DATABASE_SSL'),
          nodeEnv: configService.get<string>('NODE_ENV'),
          rejectUnauthorized: configService.get<string>(
            'DATABASE_REJECT_UNAUTHORIZED',
          ),
        }),
        entities: [
          Admin,
          SystemSetting,
          RepositoryEntity,
          Contributor,
          RepositoryContributor,
          GsocProgram,
          GsocIdea,
          GsocMentor,
          AuditLog,
        ],
        migrations: [__dirname + '/migrations/**/*.{js,ts}'],
        migrationsRun: true,
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
      GsocProgram,
      GsocIdea,
      GsocMentor,
      AuditLog,
    ]),
  ],
  providers: [AdminSeedService],
  exports: [TypeOrmModule],
})
export class DatabaseModule {}

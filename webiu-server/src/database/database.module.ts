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
          GsocProgram,
          GsocIdea,
          GsocMentor,
          AuditLog,
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

import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { CommonModule } from './common/common.module';
import { AuthModule } from './auth/auth.module';
import { ProjectModule } from './project/project.module';
import { ContributorModule } from './contributor/contributor.module';
import { UserModule } from './user/user.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    CommonModule,
    // MongooseModule can be re-enabled when MongoDB is needed:
    // MongooseModule.forRootAsync({
    //   imports: [ConfigModule],
    //   useFactory: (configService: ConfigService) => ({
    //     uri: configService.get<string>('MONGODB_URI'),
    //   }),
    //   inject: [ConfigService],
    // }),
    AuthModule,
    ProjectModule,
    ContributorModule,
    UserModule,
  ],
  controllers: [AppController],
})
export class AppModule {}

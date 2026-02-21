import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { AppController } from './app.controller';
import { CommonModule } from './common/common.module';
import { AuthModule } from './auth/auth.module';
import { ProjectModule } from './project/project.module';
import { ContributorModule } from './contributor/contributor.module';
import { UserModule } from './user/user.module';
import { GraphqlModule } from './graphql/graphql.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    // Global rate limit: 30 requests per IP per minute
    ThrottlerModule.forRoot([
      {
        ttl: 60_000, // 1-minute window (ms)
        limit: 30,
      },
    ]),
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: true,
    }),
    GraphqlModule,
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
  providers: [
    // Apply ThrottlerGuard globally to all routes
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}

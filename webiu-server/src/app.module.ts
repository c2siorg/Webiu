import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerModule } from '@nestjs/throttler';
import { ScheduleModule } from '@nestjs/schedule';
import { GqlThrottlerGuard } from './graphql/gql-throttler.guard';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import * as depthLimit from 'graphql-depth-limit';
import { Request, Response } from 'express';
import { AppController } from './app.controller';
import { CommonModule } from './common/common.module';
import { AuthModule } from './auth/auth.module';
import { ProjectModule } from './project/project.module';
import { ContributorModule } from './contributor/contributor.module';
import { UserModule } from './user/user.module';
import { GraphqlResolversModule } from './graphql/graphql.module';
import { DatabaseModule } from './database/database.module';
import { GithubWebhookModule } from './github-webhook/github-webhook.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    // Global rate limit: 30 requests per IP per minute
    ThrottlerModule.forRoot([
      {
        ttl: 60_000, // 1-minute window (ms)
        limit: 30,
      },
    ]),
    GraphQLModule.forRootAsync<ApolloDriverConfig>({
      driver: ApolloDriver,
      useFactory: (configService: ConfigService) => ({
        autoSchemaFile: true,
        playground: configService.get('NODE_ENV') !== 'production',
        introspection: configService.get('NODE_ENV') !== 'production',
        validationRules: [depthLimit(10)],
        context: ({ req, res }: { req: Request; res: Response }) => ({
          req,
          res,
        }),
      }),
      inject: [ConfigService],
    }),
    GraphqlResolversModule,
    CommonModule,
    DatabaseModule,
    AuthModule,
    ProjectModule,
    ContributorModule,
    UserModule,
    GithubWebhookModule,
  ],
  controllers: [AppController],
  providers: [
    // Apply GqlThrottlerGuard globally — handles both HTTP and GraphQL contexts
    {
      provide: APP_GUARD,
      useClass: GqlThrottlerGuard,
    },
  ],
})
export class AppModule {}

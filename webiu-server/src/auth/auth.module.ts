import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthController } from './auth.controller';
import { OAuthController } from './oauth.controller';
import { AuthService } from './auth.service';
import { GithubModule } from '../github/github.module';
import { EmailModule } from '../email/email.module';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RoleGuard } from './guards/role.guard';

@Module({
  imports: [
    // MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: '1h' },
      }),
      inject: [ConfigService],
    }),
    GithubModule,
    EmailModule,
  ],
  controllers: [AuthController, OAuthController],
  providers: [AuthService, JwtAuthGuard, RoleGuard],
  exports: [AuthService, JwtAuthGuard, RoleGuard, JwtModule],
})
export class AuthModule {}

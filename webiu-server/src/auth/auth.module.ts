import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { CredentialService } from './credential.service';
import { Admin } from '../database/entities/admin.entity';
import { AuditLogModule } from '../audit-log/audit-log.module';

@Module({
  imports: [
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: '1h' },
      }),
      inject: [ConfigService],
    }),
    TypeOrmModule.forFeature([Admin]),
    AuditLogModule,
  ],
  controllers: [AuthController],
  providers: [AuthService, CredentialService],
  exports: [AuthService, JwtModule, CredentialService],
})
export class AuthModule {}

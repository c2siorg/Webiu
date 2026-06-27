import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ServiceUnavailableException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GqlExecutionContext } from '@nestjs/graphql';
import { Admin } from '../../database/entities/admin.entity';
import { SystemSettingService } from '../../system-setting/system-setting.service';

@Injectable()
export class MaintenanceGuard implements CanActivate {
  constructor(
    private readonly systemSettingService: SystemSettingService,
    private readonly jwtService: JwtService,
    @InjectRepository(Admin)
    private readonly adminRepository: Repository<Admin>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isMaintenance = await this.systemSettingService.getSettingBool(
      'site.maintenance_mode',
    );
    if (!isMaintenance) {
      return true;
    }

    let req: any;
    if (context.getType() === 'http') {
      req = context.switchToHttp().getRequest();
    } else {
      const gqlCtx = GqlExecutionContext.create(context);
      req = gqlCtx.getContext().req;
    }

    if (!req) {
      return true;
    }

    const cleanPath = (req.path || req.url || '').split('?')[0];
    if (
      cleanPath === '/health' ||
      cleanPath === '/ready' ||
      cleanPath.startsWith('/admin') ||
      cleanPath.startsWith('/auth')
    ) {
      return true;
    }

    // Check if the request is from an authenticated admin
    const cookieHeader = req.headers?.cookie;
    const token = this.extractCookie(cookieHeader, 'admin_session');
    if (token) {
      try {
        const decoded = this.jwtService.verify(token);
        const adminExists = await this.adminRepository.findOne({
          where: { username: decoded.username },
        });

        if (
          adminExists &&
          decoded.role === 'admin' &&
          decoded.tokenVersion === adminExists.tokenVersion
        ) {
          return true;
        }
      } catch {
        // Not a valid admin token, fall through to block
      }
    }

    throw new ServiceUnavailableException(
      'Site is currently undergoing maintenance. Please try again later.',
    );
  }

  private extractCookie(
    cookieHeader: string | undefined,
    name: string,
  ): string | null {
    if (!cookieHeader) return null;
    const cookies = cookieHeader.split(';').map((c) => c.trim());
    for (const cookie of cookies) {
      const [key, ...valueParts] = cookie.split('=');
      if (key === name) {
        return valueParts.join('=');
      }
    }
    return null;
  }
}

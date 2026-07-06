import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  Optional,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { Admin } from '../../database/entities/admin.entity';
import { extractCookie } from '../../common/utils/cookie-helper';

@Injectable()
export class AdminGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    @InjectRepository(Admin)
    private readonly adminRepository: Repository<Admin>,
    @Optional() private readonly configService?: ConfigService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    // CSRF Protection: Validate Request Source for mutating methods
    const method = request.method;
    const isMutating = ['POST', 'PUT', 'DELETE', 'PATCH'].includes(method);
    if (isMutating) {
      const origin = request.headers.origin;
      const referer = request.headers.referer;
      const frontendUrl = this.configService
        ? this.configService.get<string>(
            'FRONTEND_BASE_URL',
            'http://localhost:4200',
          )
        : 'http://localhost:4200';
      const allowedOrigins = frontendUrl
        .split(',')
        .map((url) => url.trim().replace(/\/$/, '').toLowerCase());

      let isValidSource = false;
      if (origin) {
        const cleanOrigin = origin.replace(/\/$/, '').toLowerCase();
        isValidSource = allowedOrigins.includes(cleanOrigin);
      } else if (referer) {
        try {
          const refererUrl = new URL(referer);
          const cleanReferer =
            `${refererUrl.protocol}//${refererUrl.host}`.toLowerCase();
          isValidSource = allowedOrigins.includes(cleanReferer);
        } catch {
          isValidSource = false;
        }
      } else {
        // Non-browser client request (no origin/referer), allow it
        isValidSource = true;
      }

      if (!isValidSource) {
        throw new UnauthorizedException(
          'CSRF verification failed: invalid request source',
        );
      }
    }

    const cookieHeader = request.headers.cookie;

    const token = extractCookie(cookieHeader, 'admin_session');
    if (!token) {
      throw new UnauthorizedException('Authentication session missing');
    }

    try {
      const decoded = this.jwtService.verify(token);

      const adminExists = await this.adminRepository.findOne({
        where: { username: decoded.username },
      });

      if (!adminExists) {
        throw new UnauthorizedException('Not authorized as administrator');
      }

      if (decoded.role !== 'admin') {
        throw new UnauthorizedException('Not authorized as administrator');
      }

      if (decoded.tokenVersion !== adminExists.tokenVersion) {
        throw new UnauthorizedException(
          'Authentication session is invalid or expired',
        );
      }

      request.user = {
        id: adminExists.id,
        username: adminExists.username,
        role: decoded.role,
      };
      return true;
    } catch (err) {
      if (err instanceof UnauthorizedException) {
        throw err;
      }
      throw new UnauthorizedException(
        'Authentication session is invalid or expired',
      );
    }
  }
}

import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AdminGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const cookieHeader = request.headers.cookie;

    const token = this.extractCookie(cookieHeader, 'admin_session');
    if (!token) {
      throw new UnauthorizedException('Authentication session missing');
    }

    try {
      const decoded = this.jwtService.verify(token);
      const adminUser = this.configService.get<string>('ADMIN_USERNAME');

      if (!adminUser || decoded.username !== adminUser) {
        throw new UnauthorizedException('Not authorized as administrator');
      }

      request.user = decoded;
      return true;
    } catch {
      throw new UnauthorizedException(
        'Authentication session is invalid or expired',
      );
    }
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

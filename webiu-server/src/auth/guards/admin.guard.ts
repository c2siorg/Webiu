import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Admin } from '../../database/entities/admin.entity';

@Injectable()
export class AdminGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    @InjectRepository(Admin)
    private readonly adminRepository: Repository<Admin>,
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

      const adminExists = await this.adminRepository.findOne({
        where: { username: decoded.username },
      });

      if (!adminExists) {
        throw new UnauthorizedException('Not authorized as administrator');
      }

      request.user = {
        id: adminExists.id,
        username: adminExists.username,
        role: decoded.role,
      };
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

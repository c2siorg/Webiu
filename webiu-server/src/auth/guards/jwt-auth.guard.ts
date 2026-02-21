import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Not authorized');
    }

    const token = authHeader.slice(7);

    try {
      const decoded = this.jwtService.verify(token);
      // TODO: Look up user from DB when MongoDB is connected
      request.user = { id: decoded.id };
      return true;
    } catch {
      throw new UnauthorizedException('Token is not valid');
    }
  }
}

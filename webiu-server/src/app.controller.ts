import { Controller, Get, Header } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Controller()
export class AppController {
  constructor(private readonly configService: ConfigService) {}

  @Get()
  getRoot() {
    return 'Welcome to the Webiu API';
  }

  @Get('api/v1/test')
  getTest() {
    return { message: 'Server is running and working fine!' };
  }

  @Get('health')
  @Header('Cache-Control', 'no-cache')
  healthCheck() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      environment: this.configService.get<string>('NODE_ENV', 'development'),
    };
  }

  @Get('ready')
  @Header('Cache-Control', 'no-cache')
  readinessCheck() {
    return { ready: true, timestamp: new Date().toISOString() };
  }
}

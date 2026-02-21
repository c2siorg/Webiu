import { Controller, Get, Header } from '@nestjs/common';

@Controller()
export class AppController {
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
    return { status: 'ok', timestamp: new Date().toISOString() };
  }

  @Get('ready')
  @Header('Cache-Control', 'no-cache')
  readinessCheck() {
    return { ready: true, timestamp: new Date().toISOString() };
  }
}

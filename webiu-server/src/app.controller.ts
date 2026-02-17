import { Controller, Get } from '@nestjs/common';

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
}

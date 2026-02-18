import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';

describe('AppController', () => {
  let controller: AppController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
    }).compile();

    controller = module.get<AppController>(AppController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getRoot', () => {
    it('should return welcome message', () => {
      expect(controller.getRoot()).toBe('Welcome to the Webiu API');
    });
  });

  describe('getTest', () => {
    it('should return server status message', () => {
      const result = controller.getTest();
      expect(result).toEqual({
        message: 'Server is running and working fine!',
      });
    });
  });
});

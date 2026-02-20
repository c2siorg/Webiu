import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  const frontendUrl = configService.get<string>(
    'FRONTEND_BASE_URL',
    'http://localhost:4200',
  );
  app.enableCors({
    origin: frontendUrl,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    credentials: true,
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );

  const port = configService.get<number>('PORT', 5050);
  await app.listen(port);
  console.log(`Server is listening at port ${port}`);
}
bootstrap();

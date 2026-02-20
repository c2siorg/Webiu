import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  // Validate required environment variables
  const requiredEnvVars = ['GITHUB_ORG', 'FRONTEND_BASE_URL'];
  const missingEnvVars = requiredEnvVars.filter(
    (envVar) => !configService.get<string>(envVar),
  );

  if (missingEnvVars.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missingEnvVars.join(', ')}`,
    );
  }

  app.enableCors();
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

bootstrap().catch((error) => {
  console.error('Failed to bootstrap application:', error.message);
  process.exit(1);
});

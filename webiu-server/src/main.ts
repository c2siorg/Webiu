import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';
import * as compression from 'compression';

function validateEnv(): void {
  const errors: string[] = [];
  const githubToken = (process.env.GITHUB_ACCESS_TOKEN ?? '').trim();
  if (!githubToken) {
    errors.push(
      'GITHUB_ACCESS_TOKEN is missing, please do generate one from github token settings.',
    );
  }
  const jwtSecret = (process.env.JWT_SECRET ?? '').trim();
  if (!jwtSecret) {
    errors.push(
      'JWT_SECRET is missing, please set a strong secret string for JWT token',
    );
  } else if (jwtSecret.length < 15) {
    errors.push(
      'JWT_SECRET should be at least 15 characters long for better security',
    );
  }

  if (errors.length > 0) {
    console.error(
      '\nServer startup failed — missing or invalid environment variables:',
    );
    errors.forEach((error) => console.error(`  • ${error}`));
    process.exit(1);
  }
}

async function bootstrap() {
  validateEnv();
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  app.use(helmet());
  app.use(compression());

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

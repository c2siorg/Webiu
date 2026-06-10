import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';
import * as compression from 'compression';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  // 1. Startup Validation
  const criticalEnvVars = [
    'GITHUB_ACCESS_TOKEN',
    'JWT_SECRET',
    'ADMIN_USERNAME',
    'ADMIN_PASSWORD',
  ];
  const missing = criticalEnvVars.filter(
    (varName) => !configService.get(varName),
  );
  if (missing.length > 0) {
    console.error(
      `[Startup Failure] Critical environment variables are missing: ${missing.join(', ')}`,
    );
    process.exit(1);
  }

  app.use(helmet());
  app.use(compression());

  // 2. Multi-origin CORS support
  const frontendUrl = configService.get<string>(
    'FRONTEND_BASE_URL',
    'http://localhost:4200',
  );
  const allowedOrigins = frontendUrl
    .split(',')
    .map((url) => url.trim().replace(/\/$/, ''));

  app.enableCors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g. mobile apps, curl, server-to-server)
      if (!origin || allowedOrigins.includes(origin.replace(/\/$/, ''))) {
        callback(null, true);
      } else {
        callback(new Error(`Origin ${origin} not allowed by CORS`));
      }
    },
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

import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';
import * as compression from 'compression';
import { ExpressAdapter } from '@nestjs/platform-express';
import * as express from 'express';

let cachedServer: any;

async function bootstrapServer() {
    if (!cachedServer) {
        const expressApp = express();
        const adapter = new ExpressAdapter(expressApp);
        const app = await NestFactory.create(AppModule, adapter);
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

        await app.init();
        cachedServer = expressApp;
    }
    return cachedServer;
}

export default async function handler(req: any, res: any) {
    const server = await bootstrapServer();
    return server(req, res);
}

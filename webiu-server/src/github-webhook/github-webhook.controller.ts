import {
  Controller,
  Post,
  Headers,
  Req,
  HttpCode,
  HttpStatus,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import * as crypto from 'crypto';
import { SkipThrottle } from '@nestjs/throttler';
import { GithubWebhookService } from './github-webhook.service';

@SkipThrottle()
@Controller('api/v1/github-webhook')
export class GithubWebhookController {
  constructor(
    private readonly configService: ConfigService,
    private readonly webhookService: GithubWebhookService,
  ) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  async handleWebhook(
    @Headers('x-github-event') event: string,
    @Headers('x-hub-signature-256') signature: string,
    @Req() req: Request,
  ) {
    if (!signature) {
      throw new UnauthorizedException('Missing signature header');
    }

    if (!event) {
      throw new BadRequestException('Missing event header');
    }

    const webhookSecret = this.configService.get<string>(
      'GITHUB_WEBHOOK_SECRET',
    );
    if (!webhookSecret) {
      throw new UnauthorizedException('Webhook secret is not configured');
    }

    const rawBody = (req as any).rawBody;
    if (!rawBody) {
      throw new BadRequestException('Raw body is missing');
    }

    const hmac = crypto.createHmac('sha256', webhookSecret);
    const digest = 'sha256=' + hmac.update(rawBody).digest('hex');

    const signatureBuffer = Buffer.from(signature);
    const digestBuffer = Buffer.from(digest);

    if (
      signatureBuffer.length !== digestBuffer.length ||
      !crypto.timingSafeEqual(signatureBuffer, digestBuffer)
    ) {
      throw new UnauthorizedException('Invalid signature');
    }

    await this.webhookService.handleWebhookEvent(event, req.body);
    return { success: true };
  }
}

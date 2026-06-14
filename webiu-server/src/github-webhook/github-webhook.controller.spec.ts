import { Test, TestingModule } from '@nestjs/testing';
import { GithubWebhookController } from './github-webhook.controller';
import { GithubWebhookService } from './github-webhook.service';
import { ConfigService } from '@nestjs/config';
import { UnauthorizedException, BadRequestException } from '@nestjs/common';
import * as crypto from 'crypto';

describe('GithubWebhookController', () => {
  let controller: GithubWebhookController;
  let webhookService: GithubWebhookService;

  const mockWebhookService = {
    handleWebhookEvent: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn((key: string) => {
      if (key === 'GITHUB_WEBHOOK_SECRET') {
        return 'test-secret';
      }
      return null;
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [GithubWebhookController],
      providers: [
        { provide: GithubWebhookService, useValue: mockWebhookService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    controller = module.get<GithubWebhookController>(GithubWebhookController);
    webhookService = module.get<GithubWebhookService>(GithubWebhookService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should throw BadRequestException if x-github-event is missing', async () => {
    await expect(
      controller.handleWebhook(undefined, 'signature', {} as any),
    ).rejects.toThrow(BadRequestException);
  });

  it('should throw UnauthorizedException if signature header is missing', async () => {
    await expect(
      controller.handleWebhook('repository', undefined, {} as any),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('should throw BadRequestException if rawBody is missing', async () => {
    const req = {
      body: {},
    } as any;
    await expect(
      controller.handleWebhook('repository', 'signature', req),
    ).rejects.toThrow(BadRequestException);
  });

  it('should throw UnauthorizedException if signature does not match', async () => {
    const rawBody = Buffer.from(JSON.stringify({ action: 'created' }));
    const req = {
      body: { action: 'created' },
      rawBody,
    } as any;

    await expect(
      controller.handleWebhook(
        'repository',
        'sha256=invalid-signature-signature-signature-signature-signature-signature-signature',
        req,
      ),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('should process webhook and return success on valid signature', async () => {
    const payload = { action: 'created', repository: { name: 'test-repo' } };
    const rawBody = Buffer.from(JSON.stringify(payload));
    const req = {
      body: payload,
      rawBody,
    } as any;

    const hmac = crypto.createHmac('sha256', 'test-secret');
    const signature = 'sha256=' + hmac.update(rawBody).digest('hex');

    const result = await controller.handleWebhook('repository', signature, req);

    expect(result).toEqual({ success: true });
    expect(webhookService.handleWebhookEvent).toHaveBeenCalledWith(
      'repository',
      payload,
    );
  });
});

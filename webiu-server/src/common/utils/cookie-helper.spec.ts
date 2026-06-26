import { ConfigService } from '@nestjs/config';
import { getCookieOptions } from './cookie-helper';

describe('cookie-helper', () => {
  let mockConfigService: jest.Mocked<ConfigService>;

  beforeEach(() => {
    mockConfigService = {
      get: jest.fn(),
    } as any;
  });

  it('should return default cookie options when config variables are not set in development', () => {
    mockConfigService.get.mockImplementation((key: string) => {
      if (key === 'NODE_ENV') return 'development';
      return undefined;
    });

    const options = getCookieOptions(mockConfigService);

    expect(options).toEqual({
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      path: '/',
    });
  });

  it('should return secure: true in production environment by default', () => {
    mockConfigService.get.mockImplementation((key: string) => {
      if (key === 'NODE_ENV') return 'production';
      return undefined;
    });

    const options = getCookieOptions(mockConfigService);

    expect(options).toEqual({
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      path: '/',
    });
  });

  it('should respect COOKIE_SECURE environment variable', () => {
    mockConfigService.get.mockImplementation((key: string) => {
      if (key === 'COOKIE_SECURE') return 'true';
      if (key === 'NODE_ENV') return 'development';
      return undefined;
    });

    const options = getCookieOptions(mockConfigService);

    expect(options.secure).toBe(true);
  });

  it('should respect COOKIE_SAMESITE environment variable', () => {
    mockConfigService.get.mockImplementation((key: string) => {
      if (key === 'COOKIE_SAMESITE') return 'none';
      if (key === 'NODE_ENV') return 'production';
      return undefined;
    });

    const options = getCookieOptions(mockConfigService);

    expect(options.sameSite).toBe('none');
  });
});

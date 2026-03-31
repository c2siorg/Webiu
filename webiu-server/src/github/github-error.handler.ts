import { HttpException, HttpStatus } from '@nestjs/common';

export function handleGithubError(error: any): never {
  if (error.response) {
    const status = error.response.status;

    switch (status) {
      case 401:
        throw new HttpException(
          {
            status: 'error',
            message: 'GitHub API token is invalid or expired',
            code: 'GITHUB_UNAUTHORIZED',
            timestamp: new Date().toISOString(),
          },
          HttpStatus.UNAUTHORIZED,
        );

      case 403:
        throw new HttpException(
          {
            status: 'error',
            message: 'GitHub API rate limit exceeded',
            code: 'GITHUB_RATE_LIMIT',
            timestamp: new Date().toISOString(),
          },
          HttpStatus.FORBIDDEN,
        );

      case 404:
        throw new HttpException(
          {
            status: 'error',
            message: 'GitHub resource not found',
            code: 'GITHUB_NOT_FOUND',
            timestamp: new Date().toISOString(),
          },
          HttpStatus.NOT_FOUND,
        );

      default:
        throw new HttpException(
          {
            status: 'error',
            message: 'GitHub API error',
            code: 'GITHUB_ERROR',
            timestamp: new Date().toISOString(),
          },
          status,
        );
    }
  }

  if (error.code === 'ECONNABORTED') {
    throw new HttpException(
      {
        status: 'error',
        message: 'GitHub API request timed out',
        code: 'GITHUB_TIMEOUT',
        timestamp: new Date().toISOString(),
      },
      HttpStatus.REQUEST_TIMEOUT,
    );
  }

  throw new HttpException(
    {
      status: 'error',
      message: 'Unexpected error occurred',
      code: 'UNKNOWN_ERROR',
      timestamp: new Date().toISOString(),
    },
    HttpStatus.INTERNAL_SERVER_ERROR,
  );
}
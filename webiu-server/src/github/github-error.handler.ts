import {
  ForbiddenException,
  GatewayTimeoutException,
  HttpException,
  HttpStatus,
  InternalServerErrorException,
  Logger,
  NotFoundException,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import axios, { AxiosError } from 'axios';

type GithubErrorBody = {
  message?: string;
  documentation_url?: string;
};

const logger = new Logger('GithubErrorHandler');

function isGithubAxiosError(
  error: unknown,
): error is AxiosError<GithubErrorBody> {
  return (
    axios.isAxiosError<GithubErrorBody>(error) ||
    (typeof error === 'object' &&
      error !== null &&
      (error as { isAxiosError?: boolean }).isAxiosError === true)
  );
}

function getGithubMessage(error: unknown): string {
  if (isGithubAxiosError(error)) {
    return (
      error.response?.data?.message ||
      error.message ||
      'GitHub API request failed'
    );
  }

  if (error instanceof Error) {
    return error.message;
  }

  return 'Unknown GitHub API error';
}

export function handleGithubApiError(
  error: unknown,
  context = 'GitHub API request',
): never {
  const message = getGithubMessage(error);

  if (!isGithubAxiosError(error)) {
    logger.error(`${context} failed with unexpected error: ${message}`);
    throw new InternalServerErrorException({
      message: 'Unexpected GitHub API error',
      context,
    });
  }

  const status = error.response?.status;

  logger.error(
    `${context} failed: ${status ?? error.code ?? 'NO_STATUS'} ${message}`,
  );

  if (
    error.code === 'ECONNABORTED' ||
    error.message.toLowerCase().includes('timeout')
  ) {
    throw new GatewayTimeoutException({
      message: 'GitHub API request timed out',
      context,
    });
  }

  if (!error.response) {
    throw new ServiceUnavailableException({
      message: 'GitHub API is currently unreachable',
      context,
    });
  }

  if (status === 401) {
    throw new UnauthorizedException({
      message: 'GitHub API authentication failed',
      context,
    });
  }

  if (status === 403) {
    const isRateLimit = message.toLowerCase().includes('rate limit');

    if (isRateLimit) {
      throw new HttpException(
        {
          message: 'GitHub API rate limit exceeded',
          context,
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    throw new ForbiddenException({
      message: 'GitHub API access forbidden',
      context,
    });
  }

  if (status === 404) {
    throw new NotFoundException({
      message: 'Requested GitHub resource was not found',
      context,
    });
  }

  if (status && status >= 500) {
    throw new ServiceUnavailableException({
      message: 'GitHub API is temporarily unavailable',
      context,
    });
  }

  throw new InternalServerErrorException({
    message: 'GitHub API request failed',
    context,
  });
}

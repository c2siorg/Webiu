import { ExecutionContext, Injectable } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { ThrottlerGuard, ThrottlerRequest } from '@nestjs/throttler';

@Injectable()
export class GqlThrottlerGuard extends ThrottlerGuard {
  getRequestResponse(context: ExecutionContext) {
    if (context.getType() === 'http') {
      return super.getRequestResponse(context);
    }
    const gqlCtx = GqlExecutionContext.create(context);
    const ctx = gqlCtx.getContext();
    return { req: ctx.req, res: ctx.res };
  }

  protected async handleRequest(
    requestProps: ThrottlerRequest,
  ): Promise<boolean> {
    const { context } = requestProps;
    if (context.getType() === 'http') {
      const req = context.switchToHttp().getRequest();
      const path = req?.path || req?.url || '';
      if (path.startsWith('/admin')) {
        requestProps.limit = 15;
      }
    }
    return super.handleRequest(requestProps);
  }

  protected async getTracker(req: Record<string, any>): Promise<string> {
    return req?.ip ?? req?.ips?.[0] ?? req?.socket?.remoteAddress ?? 'unknown';
  }
}

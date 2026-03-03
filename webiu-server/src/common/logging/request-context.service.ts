import { AsyncLocalStorage } from 'node:async_hooks';

type RequestContext = {
  correlationId: string;
};

export class RequestContextService {
  private static readonly storage = new AsyncLocalStorage<RequestContext>();

  static run(correlationId: string, callback: () => void): void {
    // Binds correlationId to the full async call chain for this request.
    this.storage.run({ correlationId }, callback);
  }

  static getCorrelationId(): string | undefined {
    return this.storage.getStore()?.correlationId;
  }
}

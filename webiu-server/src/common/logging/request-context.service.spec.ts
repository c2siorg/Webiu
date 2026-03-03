import { RequestContextService } from './request-context.service';

describe('RequestContextService', () => {
  it('should expose correlation id inside run context', () => {
    expect(RequestContextService.getCorrelationId()).toBeUndefined();

    RequestContextService.run('test-correlation-id', () => {
      expect(RequestContextService.getCorrelationId()).toBe(
        'test-correlation-id',
      );
    });

    expect(RequestContextService.getCorrelationId()).toBeUndefined();
  });
});

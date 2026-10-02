import { InvokeStore } from '@aws/lambda-invoke-store';
import context from '@aws-lambda-powertools/testing-utils/context';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createIsolationInvocation } from '../../helpers/lmi.js';

describe('Batch LMI handler isolation', () => {
  beforeEach(() => {
    InvokeStore._testing?.reset();
    vi.resetModules();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it.each([
    { name: 'standard SQS', exportName: 'handler', fifo: false },
    { name: 'SQS FIFO', exportName: 'fifoHandler', fifo: true },
  ] as const)(
    'isolates overlapping $name handler invocations',
    async ({ exportName, fifo }) => {
      // Prepare
      vi.stubEnv('AWS_LAMBDA_MAX_CONCURRENCY', '10');
      vi.stubEnv('AWS_LAMBDA_INITIALIZATION_TYPE', 'lambda-managed-instances');
      const store = await InvokeStore.getInstanceAsync();
      const handlers = await import('../../e2e/lmi.test.functionCode.js');
      const invocations = Array.from({ length: 30 }, (_, index) =>
        createIsolationInvocation(index, fifo)
      );

      // Act
      const results = await Promise.all(
        invocations.map(({ event }) =>
          store.run({}, () => handlers[exportName](event, context))
        )
      );

      // Assess
      expect(results.every((result) => result.sawPeer)).toBe(true);
      for (const [index, result] of results.entries()) {
        const { event, expectedProcessedMessageIds, expectedFailedMessageIds } =
          invocations[index];
        expect(result.invocationId).toBe(event.invocationId);
        expect(result.receivedMessageIds).toEqual(
          event.Records.map((record) => record.messageId)
        );
        expect(result.processedMessageIds).toEqual(expectedProcessedMessageIds);
        expect(result.failedMessageIds).toHaveLength(
          expectedFailedMessageIds.length
        );
        expect(new Set(result.failedMessageIds)).toEqual(
          new Set(expectedFailedMessageIds)
        );
      }
    }
  );
});

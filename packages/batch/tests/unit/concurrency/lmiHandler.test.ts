import { InvokeStore } from '@aws/lambda-invoke-store';
import { sequence } from '@aws-lambda-powertools/testing-utils';
import context from '@aws-lambda-powertools/testing-utils/context';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  createIsolationInvocation,
  type IsolationEvent,
  type IsolationResult,
} from '../../helpers/lmi.js';

// Local regression coverage for the E2E fixtures. Deployment and real LMI
// scheduling are tested separately in tests/e2e/lmi.test.ts.
describe('Batch LMI fixture local invocation isolation', () => {
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
      // The fixture constructs module-scoped processors before sequence runs.
      await InvokeStore.getInstanceAsync();
      const handlers = await import('../../e2e/lmi.test.functionCode.js');
      const invocations = Array.from({ length: 4 }, (_, index) =>
        createIsolationInvocation(index, fifo)
      );
      /** Runs the fixture with a distinct Lambda context for each invocation. */
      const invoke = (event: IsolationEvent) => ({
        // The fixture's first-record barrier synchronizes the overlap;
        // sequence supplies the isolated invocation contexts.
        sideEffects: [],
        return: () =>
          handlers[exportName](event, {
            ...context,
            awsRequestId: `request-${event.invocationId}`,
          }),
      });

      // Act
      const results: IsolationResult[] = [];
      for (let index = 0; index < invocations.length; index += 2) {
        const [firstResult, secondResult] = await sequence(
          invoke(invocations[index].event),
          invoke(invocations[index + 1].event),
          { useInvokeStore: true }
        );
        results.push(await firstResult, await secondResult);
      }

      // Assess
      expect(results.every((result) => result.sawPeer)).toBe(true);
      for (const [index, result] of results.entries()) {
        const { event, expectedProcessedMessageIds, expectedFailedMessageIds } =
          invocations[index];
        expect(result.invocationId).toBe(event.invocationId);
        expect(result.requestId).toBe(`request-${event.invocationId}`);
        expect(result.receivedMessageIds).toEqual(
          event.Records.map((record) => record.messageId)
        );
        expect(result.processedMessageIds).toEqual(expectedProcessedMessageIds);
        expect(result.processedRequestIds).toEqual(
          expectedProcessedMessageIds.map(() => `request-${event.invocationId}`)
        );
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

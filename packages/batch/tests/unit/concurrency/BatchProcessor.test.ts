import { InvokeStore } from '@aws/lambda-invoke-store';
import { sequence } from '@aws-lambda-powertools/testing-utils';
import type { SQSRecord } from 'aws-lambda';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { BatchProcessor, EventType } from '../../../src/index.js';
import { sqsRecordFactory } from '../../helpers/factories.js';

describe('BatchProcessor concurrent invocation isolation', () => {
  beforeEach(() => {
    InvokeStore._testing?.reset();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it.each([
    {
      description: 'without InvokeStore',
      useInvokeStore: false,
      expectedResults: [[['success', 'record-B']], [['success', 'record-B']]],
    },
    {
      description: 'with InvokeStore',
      useInvokeStore: true,
      expectedResults: [[['success', 'record-A']], [['success', 'record-B']]],
    },
  ])('processes correct records per invocation $description', async ({
    useInvokeStore,
    expectedResults,
  }) => {
    // Prepare
    if (useInvokeStore) {
      vi.stubEnv('AWS_LAMBDA_MAX_CONCURRENCY', '10');
    }
    const processor = new BatchProcessor(EventType.SQS);
    const recordsA = [sqsRecordFactory('record-A')];
    const recordsB = [sqsRecordFactory('record-B')];
    const handlerA = vi.fn((record: SQSRecord) => record.body);
    const handlerB = vi.fn((record: SQSRecord) => record.body);

    // Act
    const [resultA, resultB] = await sequence(
      {
        sideEffects: [
          () => {
            processor.register(recordsA, handlerA);
          },
          () => {}, // Wait for inv2 to register
        ],
        return: async () => {
          const processed = await processor.process();
          return processed.map((p) => [p[0], p[1]]);
        },
      },
      {
        sideEffects: [
          () => {}, // Wait for inv1 to register
          () => {
            processor.register(recordsB, handlerB);
          },
        ],
        return: async () => {
          const processed = await processor.process();
          return processed.map((p) => [p[0], p[1]]);
        },
      },
      { useInvokeStore }
    );

    // Assess
    expect(resultA).toEqual(expectedResults[0]);
    expect(resultB).toEqual(expectedResults[1]);
  });

  it.each([
    {
      description: 'without InvokeStore',
      useInvokeStore: false,
      expectedCalls: {
        handlerA: 0,
        handlerB: 2,
      },
    },
    {
      description: 'with InvokeStore',
      useInvokeStore: true,
      expectedCalls: {
        handlerA: 1,
        handlerB: 1,
      },
    },
  ])('calls correct handler per invocation $description', async ({
    useInvokeStore,
    expectedCalls,
  }) => {
    // Prepare
    if (useInvokeStore) {
      vi.stubEnv('AWS_LAMBDA_MAX_CONCURRENCY', '10');
    }
    const processor = new BatchProcessor(EventType.SQS);
    const recordsA = [sqsRecordFactory('record-A')];
    const recordsB = [sqsRecordFactory('record-B')];
    const handlerA = vi.fn((record: SQSRecord) => record.body);
    const handlerB = vi.fn((record: SQSRecord) => record.body);

    // Act
    await sequence(
      {
        sideEffects: [
          () => {
            processor.register(recordsA, handlerA);
          },
          () => {}, // Wait for inv2 to register
        ],
        return: async () => {
          await processor.process();
        },
      },
      {
        sideEffects: [
          () => {}, // Wait for inv1 to register
          () => {
            processor.register(recordsB, handlerB);
          },
        ],
        return: async () => {
          await processor.process();
        },
      },
      { useInvokeStore }
    );

    // Assess
    expect(handlerA).toHaveBeenCalledTimes(expectedCalls.handlerA);
    expect(handlerB).toHaveBeenCalledTimes(expectedCalls.handlerB);
  });

  it.each([
    {
      description: 'without InvokeStore',
      useInvokeStore: false,
    },
    {
      description: 'with InvokeStore',
      useInvokeStore: true,
    },
  ])('tracks failures independently per invocation $description', async ({
    useInvokeStore,
  }) => {
    // Prepare
    if (useInvokeStore) {
      vi.stubEnv('AWS_LAMBDA_MAX_CONCURRENCY', '10');
    }
    const processor = new BatchProcessor(EventType.SQS);
    const recordsA = [sqsRecordFactory('fail')];
    const recordsB = [sqsRecordFactory('success')];
    const handlerA = vi.fn((record: SQSRecord) => {
      if (record.body === 'fail') throw new Error('Failed');
      return record.body;
    });
    const handlerB = vi.fn((record: SQSRecord) => record.body);

    // Act
    const [resultA, resultB] = await sequence(
      {
        sideEffects: [
          () => {
            processor.register(recordsA, handlerA, {
              throwOnFullBatchFailure: false,
            });
          },
          () => {}, // Wait for inv2 to register
        ],
        return: async () => {
          await processor.process();
          return processor.response().batchItemFailures;
        },
      },
      {
        sideEffects: [
          () => {}, // Wait for inv1 to register
          () => {
            processor.register(recordsB, handlerB, {
              throwOnFullBatchFailure: false,
            });
          },
        ],
        return: async () => {
          await processor.process();
          return processor.response().batchItemFailures;
        },
      },
      { useInvokeStore }
    );

    // Assess
    if (useInvokeStore) {
      expect(resultA).toEqual([{ itemIdentifier: recordsA[0].messageId }]);
      expect(resultB).toEqual([]);
    } else {
      expect(resultA).toEqual([]);
      expect(resultB).toEqual([]);
    }
  });

  it.each([
    {
      description: 'without InvokeStore',
      useInvokeStore: false,
      expectedErrorCountA: 1,
      expectedErrorCountB: 1,
    },
    {
      description: 'with InvokeStore',
      useInvokeStore: true,
      expectedErrorCountA: 2,
      expectedErrorCountB: 1,
    },
  ])('isolates use of prepare method across invocations $description', async ({
    useInvokeStore,
    expectedErrorCountA,
    expectedErrorCountB,
  }) => {
    // Prepare
    if (useInvokeStore) {
      vi.stubEnv('AWS_LAMBDA_MAX_CONCURRENCY', '10');
    }
    const processor = new BatchProcessor(EventType.SQS);
    const recordsA = [sqsRecordFactory('fail-1'), sqsRecordFactory('fail-2')];
    const recordsB = [sqsRecordFactory('fail-3')];
    const handlerA = vi.fn(() => {
      throw new Error('Handler failed');
    });
    const handlerB = vi.fn(() => {
      throw new Error('Handler failed');
    });

    // Act
    const [errorCountA, errorCountB] = await sequence(
      {
        sideEffects: [
          () => {
            processor.register(recordsA, handlerA, {
              throwOnFullBatchFailure: false,
            });
          },
          async () => {
            // Start processing while inv2 calls prepare()
            await processor.process();
          },
        ],
        return: () => processor.errors.length,
      },
      {
        sideEffects: [
          () => {
            // This prepare() call clears inv1's errors mid-processing
            processor.prepare();
          },
          async () => {
            processor.register(recordsB, handlerB, {
              throwOnFullBatchFailure: false,
            });
            await processor.process();
          },
        ],
        return: () => processor.errors.length,
      },
      { useInvokeStore }
    );

    // Assess
    expect(errorCountA).toBe(expectedErrorCountA);
    expect(errorCountB).toBe(expectedErrorCountB);
  });
});

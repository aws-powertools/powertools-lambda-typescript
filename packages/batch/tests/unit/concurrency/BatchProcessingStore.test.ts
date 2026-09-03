import { InvokeStore } from '@aws/lambda-invoke-store';
import { sequence } from '@aws-lambda-powertools/testing-utils';
import type { SQSRecord } from 'aws-lambda';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { BatchProcessingStore } from '../../../src/BatchProcessingStore.js';
import { sqsRecordFactory } from '../../helpers/factories.js';

describe('BatchProcessingStore concurrent invocation isolation', () => {
  beforeEach(() => {
    InvokeStore._testing?.reset();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
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
  ])(
    'returns empty defaults when not initialized $description',
    async ({ useInvokeStore }) => {
      // Prepare
      if (useInvokeStore) {
        vi.stubEnv('AWS_LAMBDA_MAX_CONCURRENCY', '10');
      }
      const store = new BatchProcessingStore();

      // Act
      const [resultA, resultB] = await sequence(
        {
          sideEffects: [() => {}, () => {}],
          return: () => ({
            records: store.getRecords(),
            errors: store.getErrors(),
            failureMessages: store.getFailureMessages(),
            successMessages: store.getSuccessMessages(),
            batchResponse: store.getBatchResponse(),
            handler: store.getHandler(),
          }),
        },
        {
          sideEffects: [() => {}, () => {}],
          return: () => ({
            records: store.getRecords(),
            errors: store.getErrors(),
            failureMessages: store.getFailureMessages(),
            successMessages: store.getSuccessMessages(),
            batchResponse: store.getBatchResponse(),
            handler: store.getHandler(),
          }),
        },
        { useInvokeStore }
      );

      // Assess
      expect(resultA.records).toEqual([]);
      expect(resultA.errors).toEqual([]);
      expect(resultA.failureMessages).toEqual([]);
      expect(resultA.successMessages).toEqual([]);
      expect(resultA.batchResponse).toEqual({ batchItemFailures: [] });
      expect(resultA.handler()).toBeUndefined();
      expect(resultB.records).toEqual([]);
      expect(resultB.errors).toEqual([]);
      expect(resultB.failureMessages).toEqual([]);
      expect(resultB.successMessages).toEqual([]);
      expect(resultB.batchResponse).toEqual({ batchItemFailures: [] });
      expect(resultB.handler()).toBeUndefined();
    }
  );

  it.each([
    {
      description: 'without InvokeStore',
      useInvokeStore: false,
      expectedResultA: ['record-B'],
      expectedResultB: ['record-B'],
    },
    {
      description: 'with InvokeStore',
      useInvokeStore: true,
      expectedResultA: ['record-A'],
      expectedResultB: ['record-B'],
    },
  ])(
    'isolates records per invocation $description',
    async ({ useInvokeStore, expectedResultA, expectedResultB }) => {
      // Prepare
      if (useInvokeStore) {
        vi.stubEnv('AWS_LAMBDA_MAX_CONCURRENCY', '10');
      }
      const store = new BatchProcessingStore();
      const recordsA = [sqsRecordFactory('record-A')];
      const recordsB = [sqsRecordFactory('record-B')];

      // Act
      const [resultA, resultB] = await sequence(
        {
          sideEffects: [
            () => {
              store.setRecords(recordsA);
            },
            () => {},
          ],
          return: () => store.getRecords().map((r) => (r as SQSRecord).body),
        },
        {
          sideEffects: [
            () => {},
            () => {
              store.setRecords(recordsB);
            },
          ],
          return: () => store.getRecords().map((r) => (r as SQSRecord).body),
        },
        { useInvokeStore }
      );

      // Assess
      expect(resultA).toEqual(expectedResultA);
      expect(resultB).toEqual(expectedResultB);
    }
  );

  it.each([
    {
      description: 'without InvokeStore',
      useInvokeStore: false,
      expectedResultA: ['fail-B'],
      expectedResultB: ['fail-B'],
    },
    {
      description: 'with InvokeStore',
      useInvokeStore: true,
      expectedResultA: ['fail-A'],
      expectedResultB: ['fail-B'],
    },
  ])(
    'isolates failure messages per invocation $description',
    async ({ useInvokeStore, expectedResultA, expectedResultB }) => {
      // Prepare
      if (useInvokeStore) {
        vi.stubEnv('AWS_LAMBDA_MAX_CONCURRENCY', '10');
      }
      const store = new BatchProcessingStore();
      const recordA = sqsRecordFactory('fail-A');
      const recordB = sqsRecordFactory('fail-B');

      // Act
      const [resultA, resultB] = await sequence(
        {
          sideEffects: [
            () => {
              store.setFailureMessages([recordA]);
            },
            () => {},
          ],
          return: () =>
            store.getFailureMessages().map((r) => (r as SQSRecord).body),
        },
        {
          sideEffects: [
            () => {},
            () => {
              store.setFailureMessages([recordB]);
            },
          ],
          return: () =>
            store.getFailureMessages().map((r) => (r as SQSRecord).body),
        },
        { useInvokeStore }
      );

      // Assess
      expect(resultA).toEqual(expectedResultA);
      expect(resultB).toEqual(expectedResultB);
    }
  );

  it.each([
    {
      description: 'without InvokeStore',
      useInvokeStore: false,
      expectedResultA: ['error-B'],
      expectedResultB: ['error-B'],
    },
    {
      description: 'with InvokeStore',
      useInvokeStore: true,
      expectedResultA: ['error-A'],
      expectedResultB: ['error-B'],
    },
  ])(
    'isolates errors per invocation $description',
    async ({ useInvokeStore, expectedResultA, expectedResultB }) => {
      // Prepare
      if (useInvokeStore) {
        vi.stubEnv('AWS_LAMBDA_MAX_CONCURRENCY', '10');
      }
      const store = new BatchProcessingStore();
      const errorA = new Error('error-A');
      const errorB = new Error('error-B');

      // Act
      const [resultA, resultB] = await sequence(
        {
          sideEffects: [
            () => {
              store.setErrors([errorA]);
            },
            () => {},
          ],
          return: () => store.getErrors().map((e) => e.message),
        },
        {
          sideEffects: [
            () => {},
            () => {
              store.setErrors([errorB]);
            },
          ],
          return: () => store.getErrors().map((e) => e.message),
        },
        { useInvokeStore }
      );

      // Assess
      expect(resultA).toEqual(expectedResultA);
      expect(resultB).toEqual(expectedResultB);
    }
  );

  it('shadows shared options with undefined in an invocation context', async () => {
    // Prepare
    vi.stubEnv('AWS_LAMBDA_MAX_CONCURRENCY', '10');
    const invokeStore = await InvokeStore.getInstanceAsync();
    const store = new BatchProcessingStore();
    const sharedOptions = { throwOnFullBatchFailure: false };
    store.setOptions(sharedOptions);

    // Act
    const scopedOptions = invokeStore.run({}, () => {
      store.setOptions(undefined);

      return store.getOptions();
    });

    // Assess
    expect(scopedOptions).toBeUndefined();
    expect(store.getOptions()).toBe(sharedOptions);
  });

  describe('InvokeStore error handling', () => {
    beforeEach(() => {
      vi.stubGlobal('awslambda', undefined);
    });

    afterEach(() => {
      vi.unstubAllGlobals();
    });

    it.each([
      ['getRecords', (store: BatchProcessingStore) => store.getRecords()],
      ['setRecords', (store: BatchProcessingStore) => store.setRecords([])],
      ['getHandler', (store: BatchProcessingStore) => store.getHandler()],
      [
        'setHandler',
        (store: BatchProcessingStore) => store.setHandler(() => {}),
      ],
      ['getOptions', (store: BatchProcessingStore) => store.getOptions()],
      [
        'setOptions',
        (store: BatchProcessingStore) => store.setOptions(undefined),
      ],
      [
        'getFailureMessages',
        (store: BatchProcessingStore) => store.getFailureMessages(),
      ],
      [
        'setFailureMessages',
        (store: BatchProcessingStore) => store.setFailureMessages([]),
      ],
      [
        'getSuccessMessages',
        (store: BatchProcessingStore) => store.getSuccessMessages(),
      ],
      [
        'setSuccessMessages',
        (store: BatchProcessingStore) => store.setSuccessMessages([]),
      ],
      [
        'getBatchResponse',
        (store: BatchProcessingStore) => store.getBatchResponse(),
      ],
      [
        'setBatchResponse',
        (store: BatchProcessingStore) =>
          store.setBatchResponse({ batchItemFailures: [] }),
      ],
      ['getErrors', (store: BatchProcessingStore) => store.getErrors()],
      ['setErrors', (store: BatchProcessingStore) => store.setErrors([])],
    ])(
      'throws error when %s is called with InvokeStore unavailable',
      (_method, action) => {
        // Prepare
        vi.stubEnv('AWS_LAMBDA_MAX_CONCURRENCY', '10');
        const store = new BatchProcessingStore();

        // Act & Assess
        expect(() => action(store)).toThrow('InvokeStore is not available');
      }
    );
  });
});

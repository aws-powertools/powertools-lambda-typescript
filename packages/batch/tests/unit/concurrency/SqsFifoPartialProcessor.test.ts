import { InvokeStore } from '@aws/lambda-invoke-store';
import { sequence } from '@aws-lambda-powertools/testing-utils';
import type { SQSRecord } from 'aws-lambda';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  SqsFifoPartialProcessor,
  SqsFifoPartialProcessorAsync,
} from '../../../src/index.js';
import type {
  BatchProcessingOptions,
  FailureResponse,
  PartialItemFailureResponse,
  SuccessResponse,
} from '../../../src/types.js';
import { sqsRecordFactory } from '../../helpers/factories.js';

type ProcessResult = { status: string; body: unknown; record: SQSRecord }[];

const tupleToObject = (tuple: SuccessResponse | FailureResponse) => ({
  status: tuple[0],
  body: tuple[1],
  record: tuple[2] as SQSRecord,
});

type ProcessorConfig = {
  name: string;
  processorClass:
    | typeof SqsFifoPartialProcessor
    | typeof SqsFifoPartialProcessorAsync;
  isAsync: boolean;
};

const processors: ProcessorConfig[] = [
  {
    name: 'Synchronous',
    processorClass: SqsFifoPartialProcessor,
    isAsync: false,
  },
  {
    name: 'Asynchronous',
    processorClass: SqsFifoPartialProcessorAsync,
    isAsync: true,
  },
];

describe('SQS FIFO Processors concurrent invocation isolation', () => {
  beforeEach(() => {
    InvokeStore._testing?.reset();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  for (const { name, processorClass, isAsync } of processors) {
    describe(`${name}`, () => {
      it.each([
        {
          description: 'without InvokeStore',
          useInvokeStore: false,
          expectedBodyA: 'record-B',
          expectedBodyB: 'record-B',
        },
        {
          description: 'with InvokeStore',
          useInvokeStore: true,
          expectedBodyA: 'record-A',
          expectedBodyB: 'record-B',
        },
      ])('processes correct records per invocation $description', async ({
        useInvokeStore,
        expectedBodyA,
        expectedBodyB,
      }) => {
        // Prepare
        if (useInvokeStore) {
          vi.stubEnv('AWS_LAMBDA_MAX_CONCURRENCY', '10');
        }
        const processor = new processorClass();
        const recordsA = [sqsRecordFactory('record-A', '1')];
        const recordsB = [sqsRecordFactory('record-B', '2')];
        const handlerA = vi.fn((record: SQSRecord) => record.body);
        const handlerB = vi.fn((record: SQSRecord) => record.body);

        // Act
        const [resultAPromise, resultBPromise] = await sequence<
          Promise<ProcessResult>,
          Promise<ProcessResult>
        >(
          {
            sideEffects: [
              () => {
                processor.register(recordsA, handlerA);
              },
              () => {}, // Wait for inv2 to register
            ],
            return: async () => {
              const processed = isAsync
                ? await processor.process()
                : processor.processSync();
              return processed.map(tupleToObject);
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
              const processed = isAsync
                ? await processor.process()
                : processor.processSync();
              return processed.map(tupleToObject);
            },
          },
          { useInvokeStore }
        );

        // Assess
        const resultA = await resultAPromise;
        const resultB = await resultBPromise;
        expect(resultA).toHaveLength(1);
        expect(resultA[0].body).toBe(expectedBodyA);
        expect(resultB).toHaveLength(1);
        expect(resultB[0].body).toBe(expectedBodyB);
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
        const processor = new processorClass();
        const recordsA = [sqsRecordFactory('record-A', '1')];
        const recordsB = [sqsRecordFactory('record-B', '2')];
        const handlerA = vi.fn((record: SQSRecord) => record.body);
        const handlerB = vi.fn((record: SQSRecord) => record.body);

        // Act
        await sequence<Promise<void>, Promise<void>>(
          {
            sideEffects: [
              () => {
                processor.register(recordsA, handlerA);
              },
              () => {}, // Wait for inv2 to register
            ],
            return: async () => {
              if (isAsync) {
                await processor.process();
              } else {
                processor.processSync();
              }
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
              if (isAsync) {
                await processor.process();
              } else {
                processor.processSync();
              }
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
          expectedLengthA: 3,
          expectedLengthASync: 2,
          expectedLengthB: 3,
          expectedLengthBSync: 2,
        },
        {
          description: 'with InvokeStore',
          useInvokeStore: true,
          expectedLengthA: 0,
          expectedLengthASync: 0,
          expectedLengthB: 2,
          expectedLengthBSync: 2,
        },
      ])('tracks failures and short-circuits independently per invocation $description', async ({
        useInvokeStore,
        expectedLengthA,
        expectedLengthASync,
        expectedLengthB,
        expectedLengthBSync,
      }) => {
        // Prepare
        if (useInvokeStore) {
          vi.stubEnv('AWS_LAMBDA_MAX_CONCURRENCY', '10');
        }
        const processor = new processorClass();
        const recordsA = [sqsRecordFactory('body-A-2', '1')];
        const recordsB = [
          sqsRecordFactory('fail', '1'),
          sqsRecordFactory('body-B', '1'),
        ];

        const handlerA = vi.fn((record: SQSRecord) => record.body);
        const handlerB = vi.fn((record: SQSRecord) => {
          if (record.body === 'fail') throw new Error('Processing failed');
          return record.body;
        });

        // Act
        const [resultAPromise, resultBPromise] = await sequence<
          Promise<PartialItemFailureResponse>,
          Promise<PartialItemFailureResponse>
        >(
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
              isAsync ? await processor.process() : processor.processSync();
              return processor.response();
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
              isAsync ? await processor.process() : processor.processSync();
              return processor.response();
            },
          },
          { useInvokeStore }
        );

        // Assess
        const resultA = await resultAPromise;
        const resultB = await resultBPromise;
        expect(resultA.batchItemFailures).toHaveLength(
          isAsync ? expectedLengthA : expectedLengthASync
        );
        expect(resultB.batchItemFailures).toHaveLength(
          isAsync ? expectedLengthB : expectedLengthBSync
        );
      });

      it.each([
        {
          description: 'without InvokeStore',
          useInvokeStore: false,
          expectedLengthA: 2,
          expectedLengthB: 2,
        },
        {
          description: 'with InvokeStore',
          useInvokeStore: true,
          expectedLengthA: 4,
          expectedLengthB: 2,
        },
      ])('skips failed group but processes other groups independently $description', async ({
        useInvokeStore,
        expectedLengthA,
        expectedLengthB,
      }) => {
        // Prepare
        if (useInvokeStore) {
          vi.stubEnv('AWS_LAMBDA_MAX_CONCURRENCY', '10');
        }
        const processor = new processorClass();
        const recordsA = [
          sqsRecordFactory('fail', '1'),
          sqsRecordFactory('success-1', '1'),
          sqsRecordFactory('success-2a', '2'),
          sqsRecordFactory('success-2b', '2'),
        ];
        const recordsB = [
          sqsRecordFactory('success-3', '3'),
          sqsRecordFactory('success-4', '4'),
        ];
        const handlerA = vi.fn((record: SQSRecord) => {
          if (record.body === 'fail') throw new Error('Processing failed');
          return record.body;
        });
        const handlerB = vi.fn((record: SQSRecord) => record.body);

        // Act
        const [resultAPromise, resultBPromise] = await sequence<
          Promise<ProcessResult>,
          Promise<ProcessResult>
        >(
          {
            sideEffects: [
              () => {
                processor.register(recordsA, handlerA, {
                  skipGroupOnError: true,
                  throwOnFullBatchFailure: false,
                } as BatchProcessingOptions<
                  InstanceType<typeof processorClass>
                >);
              },
              () => {}, // Wait for inv2 to register
            ],
            return: async () => {
              const processed = isAsync
                ? await processor.process()
                : processor.processSync();
              return processed.map(tupleToObject);
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
              const processed = isAsync
                ? await processor.process()
                : processor.processSync();
              return processed.map(tupleToObject);
            },
          },
          { useInvokeStore }
        );

        // Assess
        const resultA = await resultAPromise;
        const resultB = await resultBPromise;
        expect(resultA).toHaveLength(expectedLengthA);
        expect(resultB).toHaveLength(expectedLengthB);
        if (useInvokeStore) {
          expect(resultA[0].record.body).toBe('fail'); // group 1 fails
          expect(resultA[1].status).toBe('fail');
          expect(resultA[1].record.body).toBe('success-1'); // group 1 skipped
          expect(resultA[2].record.body).toBe('success-2a'); // group 2 processes
          expect(resultA[3].record.body).toBe('success-2b'); // group 2 processes
          expect(resultB[0].record.body).toBe('success-3'); // group 3 processes
          expect(resultB[1].record.body).toBe('success-4'); // group 4 processes
        } else {
          // Without InvokeStore: both invocations process invB's records
          expect(resultA).toHaveLength(expectedLengthA);
          expect(resultB).toHaveLength(expectedLengthB);
          // Both process invB's records due to state leaking
          expect(resultA[0].record.body).toBe('success-3'); // processed invB's records
          expect(resultA[1].record.body).toBe('success-4');
          expect(resultB[0].status).toBe('success');
          expect(resultB[1].status).toBe('success');
        }
      });
    });
  }
});

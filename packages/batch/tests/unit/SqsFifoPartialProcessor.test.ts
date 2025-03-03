import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  SqsFifoMessageGroupShortCircuitError,
  SqsFifoPartialProcessor,
  SqsFifoPartialProcessorAsync,
  SqsFifoShortCircuitError,
  processPartialResponse,
  processPartialResponseSync,
} from '../../src/index.js';
import type { PartialItemFailureResponse } from '../../src/types.js';
import { sqsRecordFactory } from '../helpers/factories.js';
import { sqsRecordHandler } from '../helpers/handlers.js';

type ProcessorConfig = {
  name: string;
  processorClass:
    | typeof SqsFifoPartialProcessor
    | typeof SqsFifoPartialProcessorAsync;
  processFunction:
    | typeof processPartialResponse
    | typeof processPartialResponseSync;
  isAsync: boolean;
};

const processors: ProcessorConfig[] = [
  {
    name: 'Synchronous',
    processorClass: SqsFifoPartialProcessor,
    processFunction: processPartialResponseSync,
    isAsync: false,
  },
  {
    name: 'Asynchronous',
    processorClass: SqsFifoPartialProcessorAsync,
    processFunction: processPartialResponse,
    isAsync: true,
  },
];

describe('SQS FIFO Processors', () => {
  const ENVIRONMENT_VARIABLES = process.env;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env = { ...ENVIRONMENT_VARIABLES };
  });

  afterAll(() => {
    process.env = ENVIRONMENT_VARIABLES;
  });

  for (const { name, processorClass, processFunction, isAsync } of processors) {
    describe(`${name} SQS FIFO batch processing`, () => {
      it('completes processing with no failures', async () => {
        // Prepare
        const firstRecord = sqsRecordFactory('success');
        const secondRecord = sqsRecordFactory('success');
        const event = { Records: [firstRecord, secondRecord] };
        const processor = new processorClass();

        // Act
        const result = isAsync
          ? await processFunction(event, sqsRecordHandler, processor)
          : (processFunction(
              event,
              sqsRecordHandler,
              processor
            ) as PartialItemFailureResponse);

        // Assess
        expect(result.batchItemFailures).toStrictEqual([]);
      });

      it('completes processing with some failures', async () => {
        // Prepare
        const firstRecord = sqsRecordFactory('success');
        const secondRecord = sqsRecordFactory('fail');
        const thirdRecord = sqsRecordFactory('success');
        const event = { Records: [firstRecord, secondRecord, thirdRecord] };
        const processor = new processorClass();

        // Act
        const result = isAsync
          ? await processFunction(event, sqsRecordHandler, processor)
          : (processFunction(
              event,
              sqsRecordHandler,
              processor
            ) as PartialItemFailureResponse);

        // Assess
        expect(result.batchItemFailures.length).toBe(2);
        expect(result.batchItemFailures[0].itemIdentifier).toBe(
          secondRecord.messageId
        );
        expect(result.batchItemFailures[1].itemIdentifier).toBe(
          thirdRecord.messageId
        );
        expect(processor.errors[1]).toBeInstanceOf(SqsFifoShortCircuitError);
      });

      it('continues processing and moves to the next group when `skipGroupOnError` is true', async () => {
        // Prepare
        const firstRecord = sqsRecordFactory('fail', '1');
        const secondRecord = sqsRecordFactory('success', '1');
        const thirdRecord = sqsRecordFactory('fail', '2');
        const fourthRecord = sqsRecordFactory('success', '2');
        const fifthRecord = sqsRecordFactory('success', '3');
        const event = {
          Records: [
            firstRecord,
            secondRecord,
            thirdRecord,
            fourthRecord,
            fifthRecord,
          ],
        };
        const processor = new processorClass();

        // Act
        const result = isAsync
          ? await processFunction(event, sqsRecordHandler, processor, {
              skipGroupOnError: true,
            })
          : (processFunction(event, sqsRecordHandler, processor, {
              skipGroupOnError: true,
            }) as PartialItemFailureResponse);

        // Assess
        expect(result.batchItemFailures.length).toBe(4);
        expect(result.batchItemFailures[0].itemIdentifier).toBe(
          firstRecord.messageId
        );
        expect(result.batchItemFailures[1].itemIdentifier).toBe(
          secondRecord.messageId
        );
        expect(result.batchItemFailures[2].itemIdentifier).toBe(
          thirdRecord.messageId
        );
        expect(result.batchItemFailures[3].itemIdentifier).toBe(
          fourthRecord.messageId
        );
        expect(processor.errors.length).toBe(4);
        expect(processor.errors[1]).toBeInstanceOf(
          SqsFifoMessageGroupShortCircuitError
        );
        expect(processor.errors[3]).toBeInstanceOf(
          SqsFifoMessageGroupShortCircuitError
        );
      });

      it('short circuits on the first failure when `skipGroupOnError` is false', async () => {
        // Prepare
        const firstRecord = sqsRecordFactory('success', '1');
        const secondRecord = sqsRecordFactory('fail', '2');
        const thirdRecord = sqsRecordFactory('success', '3');
        const fourthRecord = sqsRecordFactory('success', '4');
        const event = {
          Records: [firstRecord, secondRecord, thirdRecord, fourthRecord],
        };
        const processor = new processorClass();

        // Act
        const result = isAsync
          ? await processFunction(event, sqsRecordHandler, processor, {
              skipGroupOnError: false,
            })
          : (processFunction(event, sqsRecordHandler, processor, {
              skipGroupOnError: false,
            }) as PartialItemFailureResponse);

        // Assess
        expect(result.batchItemFailures.length).toBe(3);
        expect(result.batchItemFailures[0].itemIdentifier).toBe(
          secondRecord.messageId
        );
        expect(result.batchItemFailures[1].itemIdentifier).toBe(
          thirdRecord.messageId
        );
        expect(result.batchItemFailures[2].itemIdentifier).toBe(
          fourthRecord.messageId
        );
        expect(processor.errors.length).toBe(3);
        expect(processor.errors[1]).toBeInstanceOf(SqsFifoShortCircuitError);
      });
    });
  }

  it('continues processing and moves to the next group when `skipGroupOnError` is true', async () => {
    // Prepare
    const firstRecord = sqsRecordFactory('fail', '1');
    const secondRecord = sqsRecordFactory('success', '2');
    const firstRecordAgain = sqsRecordFactory('success', '1');
    const event1 = {
      Records: [firstRecord, secondRecord],
    };
    const event2 = {
      Records: [firstRecordAgain],
    };
    const processor = new SqsFifoPartialProcessor();
    const fn = vi.fn((record) => {
      if (record.body.includes('fail')) {
        throw new Error('Processing failed');
      }

      return record;
    });

    // Act
    const result1 = processPartialResponseSync(event1, fn, processor, {
      skipGroupOnError: true,
      throwOnFullBatchFailure: false,
    });
    const result2 = processPartialResponseSync(event2, fn, processor, {
      skipGroupOnError: true,
      throwOnFullBatchFailure: false,
    });

    // Assess
    expect(result1.batchItemFailures.length).toBe(1);
    expect(result2.batchItemFailures.length).toBe(0);
    expect(fn).toHaveBeenCalledTimes(3);
  });
});

import assert from 'node:assert';
import context from '@aws-lambda-powertools/testing-utils/context';
import type {
  Context,
  DynamoDBStreamEvent,
  KinesisStreamEvent,
  SQSEvent,
} from 'aws-lambda';
import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  BatchProcessor,
  EventType,
  FullBatchFailureError,
  UnexpectedBatchTypeError,
  processPartialResponse,
} from '../../src/index.js';
import type {
  BatchProcessingOptions,
  PartialItemFailureResponse,
} from '../../src/types.js';
import {
  dynamodbRecordFactory,
  kinesisRecordFactory,
  sqsRecordFactory,
} from '../helpers/factories.js';
import {
  asyncDynamodbRecordHandler,
  asyncHandlerWithContext,
  asyncKinesisRecordHandler,
  asyncSqsRecordHandler,
} from '../helpers/handlers.js';

describe('Function: processPartialResponse()', () => {
  const ENVIRONMENT_VARIABLES = process.env;
  const options: BatchProcessingOptions = {
    context,
  };

  const handlerWithSqsEvent = async (
    event: SQSEvent,
    options: BatchProcessingOptions
  ) => {
    const processor = new BatchProcessor(EventType.SQS);

    const handler = async (
      event: SQSEvent,
      _context: Context
    ): Promise<PartialItemFailureResponse> =>
      processPartialResponse(event, asyncSqsRecordHandler, processor, options);

    return handler(event, context);
  };

  const handlerWithKinesisEvent = async (
    event: KinesisStreamEvent,
    options: BatchProcessingOptions
  ) => {
    const processor = new BatchProcessor(EventType.KinesisDataStreams);

    const handler = async (
      event: KinesisStreamEvent,
      _context: Context
    ): Promise<PartialItemFailureResponse> =>
      processPartialResponse(
        event,
        asyncKinesisRecordHandler,
        processor,
        options
      );

    return handler(event, context);
  };

  const handlerWithDynamoDBEvent = async (
    event: DynamoDBStreamEvent,
    options: BatchProcessingOptions
  ) => {
    const processor = new BatchProcessor(EventType.DynamoDBStreams);

    const handler = async (
      event: DynamoDBStreamEvent,
      _context: Context
    ): Promise<PartialItemFailureResponse> => {
      return await processPartialResponse(
        event,
        asyncDynamodbRecordHandler,
        processor,
        options
      );
    };

    return handler(event, context);
  };

  beforeEach(() => {
    vi.clearAllMocks();
    process.env = { ...ENVIRONMENT_VARIABLES };
  });

  afterAll(() => {
    process.env = ENVIRONMENT_VARIABLES;
  });

  describe('Process partial response function call tests', () => {
    const cases = [
      {
        description: 'in parallel',
        processingOptions: { processInParallel: true },
      },
      {
        description: 'sequentially',
        processingOptions: { processInParallel: false },
      },
    ];

    describe.each(cases)('$description', ({ processingOptions }) => {
      it('Process partial response function call with asynchronous handler', async () => {
        // Prepare
        const records = [
          sqsRecordFactory('success'),
          sqsRecordFactory('success'),
        ];
        const batch = { Records: records };
        const processor = new BatchProcessor(EventType.SQS);

        // Act
        const ret = await processPartialResponse(
          batch,
          asyncSqsRecordHandler,
          processor,
          processingOptions
        );

        // Assess
        expect(ret).toStrictEqual({ batchItemFailures: [] });
      });

      it('Process partial response function call with context provided', async () => {
        // Prepare
        const records = [
          sqsRecordFactory('success'),
          sqsRecordFactory('success'),
        ];
        const batch = { Records: records };
        const processor = new BatchProcessor(EventType.SQS);

        // Act
        const ret = await processPartialResponse(
          batch,
          asyncHandlerWithContext,
          processor,
          {
            ...processingOptions,
            ...options,
          }
        );

        // Assess
        expect(ret).toStrictEqual({ batchItemFailures: [] });
      });

      it('Process partial response function call with asynchronous handler for full batch failure', async () => {
        // Prepare
        const records = [sqsRecordFactory('fail'), sqsRecordFactory('fail')];
        const batch = { Records: records };
        const processor = new BatchProcessor(EventType.SQS);

        // Act & Assess
        await expect(
          processPartialResponse(
            batch,
            asyncSqsRecordHandler,
            processor,
            processingOptions
          )
        ).rejects.toThrow(FullBatchFailureError);
      });

      it('Process partial response function call with asynchronous handler for full batch failure when `throwOnFullBatchFailure` is `true`', async () => {
        // Prepare
        const records = [sqsRecordFactory('fail'), sqsRecordFactory('fail')];
        const batch = { Records: records };
        const processor = new BatchProcessor(EventType.SQS);

        // Act & Assess
        await expect(
          processPartialResponse(batch, asyncSqsRecordHandler, processor, {
            ...processingOptions,
            ...options,
            throwOnFullBatchFailure: true,
          })
        ).rejects.toThrow(FullBatchFailureError);
      });

      it('Process partial response function call with asynchronous handler for full batch failure when `throwOnFullBatchFailure` is `false`', async () => {
        // Prepare
        const records = [sqsRecordFactory('fail'), sqsRecordFactory('fail')];
        const batch = { Records: records };
        const processor = new BatchProcessor(EventType.SQS);

        // Act
        const response = await processPartialResponse(
          batch,
          asyncSqsRecordHandler,
          processor,
          {
            ...processingOptions,
            ...options,
            throwOnFullBatchFailure: false,
          }
        );

        // Assess
        expect(response).toStrictEqual({
          batchItemFailures: [
            { itemIdentifier: records[0].messageId },
            { itemIdentifier: records[1].messageId },
          ],
        });
      });
    });
  });

  describe('Process partial response function call through handler', () => {
    const cases = [
      {
        description: 'in parallel',
        processingOptions: { processInParallel: true },
      },
      {
        description: 'sequentially',
        processingOptions: { processInParallel: false },
      },
    ];

    describe.each(cases)('$description', ({ processingOptions }) => {
      it('Process partial response through handler with SQS event', async () => {
        // Prepare
        const records = [
          sqsRecordFactory('success'),
          sqsRecordFactory('success'),
        ];
        const event: SQSEvent = { Records: records };

        // Act
        const result = await handlerWithSqsEvent(event, processingOptions);

        // Assess
        expect(result).toStrictEqual({ batchItemFailures: [] });
      });

      it('Process partial response through handler with Kinesis event', async () => {
        // Prepare
        const records = [
          kinesisRecordFactory('success'),
          kinesisRecordFactory('success'),
        ];
        const event: KinesisStreamEvent = { Records: records };

        // Act
        const result = await handlerWithKinesisEvent(event, processingOptions);

        // Assess
        expect(result).toStrictEqual({ batchItemFailures: [] });
      });

      it('Process partial response through handler with DynamoDB event', async () => {
        // Prepare
        const records = [
          dynamodbRecordFactory('success'),
          dynamodbRecordFactory('success'),
        ];
        const event: DynamoDBStreamEvent = { Records: records };

        // Act
        const result = await handlerWithDynamoDBEvent(event, processingOptions);

        // Assess
        expect(result).toStrictEqual({ batchItemFailures: [] });
      });

      it('Process partial response through handler for SQS records with incorrect event type', async () => {
        try {
          // Act
          await handlerWithSqsEvent(
            {} as unknown as SQSEvent,
            processingOptions
          );
        } catch (error) {
          // Assess
          assert(error instanceof UnexpectedBatchTypeError);
          expect(error.message).toBe(
            `Unexpected batch type. Possible values are: ${Object.keys(
              EventType
            ).join(', ')}`
          );
        }
      });

      it('Process partial response through handler with context provided', async () => {
        // Prepare
        const records = [
          sqsRecordFactory('success'),
          sqsRecordFactory('success'),
        ];
        const event: SQSEvent = { Records: records };

        // Act
        const result = await handlerWithSqsEvent(event, {
          context,
          ...processingOptions,
        });

        // Assess
        expect(result).toStrictEqual({ batchItemFailures: [] });
      });

      it('Process partial response through handler for full batch failure', async () => {
        // Prepare
        const records = [sqsRecordFactory('fail'), sqsRecordFactory('fail')];
        const event: SQSEvent = { Records: records };

        // Act & Assess
        await expect(
          handlerWithSqsEvent(event, processingOptions)
        ).rejects.toThrow(FullBatchFailureError);
      });

      it('Process partial response through handler for full batch failure when `throwOnFullBatchFailure` is `true`', async () => {
        // Prepare
        const records = [sqsRecordFactory('fail'), sqsRecordFactory('fail')];
        const event: SQSEvent = { Records: records };

        // Act & Assess
        await expect(
          handlerWithSqsEvent(event, {
            ...options,
            ...processingOptions,
            throwOnFullBatchFailure: true,
          })
        ).rejects.toThrow(FullBatchFailureError);
      });

      it('Process partial response through handler for full batch failure when `throwOnFullBatchFailure` is `false`', async () => {
        // Prepare
        const records = [sqsRecordFactory('fail'), sqsRecordFactory('fail')];
        const event: SQSEvent = { Records: records };

        // Act
        const response = await handlerWithSqsEvent(event, {
          ...options,
          ...processingOptions,
          throwOnFullBatchFailure: false,
        });

        // Assess
        expect(response).toStrictEqual({
          batchItemFailures: [
            { itemIdentifier: records[0].messageId },
            { itemIdentifier: records[1].messageId },
          ],
        });
      });
    });
  });
});

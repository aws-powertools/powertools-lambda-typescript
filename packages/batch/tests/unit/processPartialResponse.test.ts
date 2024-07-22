/**
 * Test asyncProcessPartialResponse function
 *
 * @group unit/batch/function/asyncProcesspartialresponse
 */
import assert from 'node:assert';
import context from '@aws-lambda-powertools/testing-utils/context';
import type {
  Context,
  DynamoDBStreamEvent,
  KinesisStreamEvent,
  SQSEvent,
} from 'aws-lambda';
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

  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();
    process.env = { ...ENVIRONMENT_VARIABLES };
  });

  afterAll(() => {
    process.env = ENVIRONMENT_VARIABLES;
  });

  describe('Process partial response function call tests', () => {
    test('Process partial response function call with asynchronous handler', async () => {
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
        processor
      );

      // Assess
      expect(ret).toStrictEqual({ batchItemFailures: [] });
    });

    test('Process partial response function call with context provided', async () => {
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
        options
      );

      // Assess
      expect(ret).toStrictEqual({ batchItemFailures: [] });
    });

    test('Process partial response function call with asynchronous handler for full batch failure', async () => {
      // Prepare
      const records = [sqsRecordFactory('fail'), sqsRecordFactory('fail')];
      const batch = { Records: records };
      const processor = new BatchProcessor(EventType.SQS);

      // Act & Assess
      await expect(
        processPartialResponse(batch, asyncSqsRecordHandler, processor)
      ).rejects.toThrow(FullBatchFailureError);
    });

    test('Process partial response function call with asynchronous handler for full batch failure when `throwOnFullBatchFailure` is `true`', async () => {
      // Prepare
      const records = [sqsRecordFactory('fail'), sqsRecordFactory('fail')];
      const batch = { Records: records };
      const processor = new BatchProcessor(EventType.SQS);

      // Act & Assess
      await expect(
        processPartialResponse(batch, asyncSqsRecordHandler, processor, {
          ...options,
          throwOnFullBatchFailure: true,
        })
      ).rejects.toThrow(FullBatchFailureError);
    });

    test('Process partial response function call with asynchronous handler for full batch failure when `throwOnFullBatchFailure` is `false`', async () => {
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

  describe('Process partial response function call through handler', () => {
    test('Process partial response through handler with SQS event', async () => {
      // Prepare
      const records = [
        sqsRecordFactory('success'),
        sqsRecordFactory('success'),
      ];
      const processor = new BatchProcessor(EventType.SQS);
      const event: SQSEvent = { Records: records };

      const handler = async (
        event: SQSEvent,
        _context: Context
      ): Promise<PartialItemFailureResponse> => {
        return processPartialResponse(event, asyncSqsRecordHandler, processor);
      };

      // Act
      const result = await handler(event, context);

      // Assess
      expect(result).toStrictEqual({ batchItemFailures: [] });
    });

    test('Process partial response through handler with Kinesis event', async () => {
      // Prepare
      const records = [
        kinesisRecordFactory('success'),
        kinesisRecordFactory('success'),
      ];
      const processor = new BatchProcessor(EventType.KinesisDataStreams);
      const event: KinesisStreamEvent = { Records: records };

      const handler = async (
        event: KinesisStreamEvent,
        _context: Context
      ): Promise<PartialItemFailureResponse> => {
        return await processPartialResponse(
          event,
          asyncKinesisRecordHandler,
          processor
        );
      };

      // Act
      const result = await handler(event, context);

      // Assess
      expect(result).toStrictEqual({ batchItemFailures: [] });
    });

    test('Process partial response through handler with DynamoDB event', async () => {
      // Prepare
      const records = [
        dynamodbRecordFactory('success'),
        dynamodbRecordFactory('success'),
      ];
      const processor = new BatchProcessor(EventType.DynamoDBStreams);
      const event: DynamoDBStreamEvent = { Records: records };

      const handler = async (
        event: DynamoDBStreamEvent,
        _context: Context
      ): Promise<PartialItemFailureResponse> => {
        return await processPartialResponse(
          event,
          asyncDynamodbRecordHandler,
          processor
        );
      };

      // Act
      const result = await handler(event, context);

      // Assess
      expect(result).toStrictEqual({ batchItemFailures: [] });
    });

    test('Process partial response through handler for SQS records with incorrect event type', async () => {
      // Prepare
      const processor = new BatchProcessor(EventType.SQS);

      const handler = async (
        event: SQSEvent,
        _context: Context
      ): Promise<PartialItemFailureResponse> => {
        return await processPartialResponse(
          event,
          asyncSqsRecordHandler,
          processor
        );
      };

      try {
        // Act
        await handler({} as unknown as SQSEvent, context);
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

    test('Process partial response through handler with context provided', async () => {
      // Prepare
      const records = [
        sqsRecordFactory('success'),
        sqsRecordFactory('success'),
      ];
      const processor = new BatchProcessor(EventType.SQS);
      const event: SQSEvent = { Records: records };

      const handler = async (
        event: SQSEvent,
        context: Context
      ): Promise<PartialItemFailureResponse> => {
        const options: BatchProcessingOptions = { context: context };

        return await processPartialResponse(
          event,
          asyncHandlerWithContext,
          processor,
          options
        );
      };

      // Act
      const result = await handler(event, context);

      // Assess
      expect(result).toStrictEqual({ batchItemFailures: [] });
    });

    test('Process partial response through handler for full batch failure', async () => {
      // Prepare
      const records = [sqsRecordFactory('fail'), sqsRecordFactory('fail')];
      const processor = new BatchProcessor(EventType.SQS);
      const event: SQSEvent = { Records: records };

      const handler = async (
        event: SQSEvent,
        _context: Context
      ): Promise<PartialItemFailureResponse> => {
        return processPartialResponse(event, asyncSqsRecordHandler, processor);
      };

      // Act & Assess
      await expect(handler(event, context)).rejects.toThrow(
        FullBatchFailureError
      );
    });

    test('Process partial response through handler for full batch failure when `throwOnFullBatchFailure` is `true`', async () => {
      // Prepare
      const records = [sqsRecordFactory('fail'), sqsRecordFactory('fail')];
      const processor = new BatchProcessor(EventType.SQS);
      const event: SQSEvent = { Records: records };

      const handler = async (
        event: SQSEvent,
        _context: Context
      ): Promise<PartialItemFailureResponse> => {
        return processPartialResponse(event, asyncSqsRecordHandler, processor, {
          ...options,
          throwOnFullBatchFailure: true,
        });
      };

      // Act & Assess
      await expect(handler(event, context)).rejects.toThrow(
        FullBatchFailureError
      );
    });

    test('Process partial response through handler for full batch failure when `throwOnFullBatchFailure` is `false`', async () => {
      // Prepare
      const records = [sqsRecordFactory('fail'), sqsRecordFactory('fail')];
      const processor = new BatchProcessor(EventType.SQS);
      const event: SQSEvent = { Records: records };

      const handler = async (
        event: SQSEvent,
        _context: Context
      ): Promise<PartialItemFailureResponse> => {
        return processPartialResponse(event, asyncSqsRecordHandler, processor, {
          ...options,
          throwOnFullBatchFailure: false,
        });
      };

      // Act
      const response = await handler(event, context);

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

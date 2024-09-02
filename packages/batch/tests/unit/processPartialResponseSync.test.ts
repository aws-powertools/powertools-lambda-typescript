import context from '@aws-lambda-powertools/testing-utils/context';
import type {
  Context,
  DynamoDBStreamEvent,
  KinesisStreamEvent,
  SQSEvent,
} from 'aws-lambda';
import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  BatchProcessorSync,
  EventType,
  FullBatchFailureError,
  UnexpectedBatchTypeError,
  processPartialResponseSync,
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
  dynamodbRecordHandler,
  handlerWithContext,
  kinesisRecordHandler,
  sqsRecordHandler,
} from '../helpers/handlers.js';

describe('Function: processPartialResponse()', () => {
  const ENVIRONMENT_VARIABLES = process.env;
  const options: BatchProcessingOptions = {
    context,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    process.env = { ...ENVIRONMENT_VARIABLES };
  });

  afterAll(() => {
    process.env = ENVIRONMENT_VARIABLES;
  });

  describe('Process partial response function call tests', () => {
    it('Process partial response function call with synchronous handler', () => {
      // Prepare
      const records = [
        sqsRecordFactory('success'),
        sqsRecordFactory('success'),
      ];
      const batch = { Records: records };
      const processor = new BatchProcessorSync(EventType.SQS);

      // Act
      const ret = processPartialResponseSync(
        batch,
        sqsRecordHandler,
        processor
      );

      // Assess
      expect(ret).toStrictEqual({ batchItemFailures: [] });
    });

    it('Process partial response function call with context provided', () => {
      // Prepare
      const records = [
        sqsRecordFactory('success'),
        sqsRecordFactory('success'),
      ];
      const batch = { Records: records };
      const processor = new BatchProcessorSync(EventType.SQS);

      // Act
      const ret = processPartialResponseSync(
        batch,
        handlerWithContext,
        processor,
        options
      );

      // Assess
      expect(ret).toStrictEqual({ batchItemFailures: [] });
    });

    it('Process partial response function call with synchronous handler for full batch failure', () => {
      // Prepare
      const records = [sqsRecordFactory('fail'), sqsRecordFactory('fail')];
      const batch = { Records: records };
      const processor = new BatchProcessorSync(EventType.SQS);

      // Act & Assess
      expect(() =>
        processPartialResponseSync(batch, sqsRecordHandler, processor)
      ).toThrow(FullBatchFailureError);
    });

    it('Process partial response function call with synchronous handler for full batch failure when `throwOnFullBatchFailure` is `true`', () => {
      // Prepare
      const records = [sqsRecordFactory('fail'), sqsRecordFactory('fail')];
      const batch = { Records: records };
      const processor = new BatchProcessorSync(EventType.SQS);

      // Act & Assess
      expect(() =>
        processPartialResponseSync(batch, sqsRecordHandler, processor, {
          ...options,
          throwOnFullBatchFailure: true,
        })
      ).toThrow(FullBatchFailureError);
    });

    it('Process partial response function call with synchronous handler for full batch failure when `throwOnFullBatchFailure` is `false`', () => {
      // Prepare
      const records = [sqsRecordFactory('fail'), sqsRecordFactory('fail')];
      const batch = { Records: records };
      const processor = new BatchProcessorSync(EventType.SQS);

      // Act
      const response = processPartialResponseSync(
        batch,
        sqsRecordHandler,
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
    it('Process partial response through handler with SQS event', () => {
      // Prepare
      const records = [
        sqsRecordFactory('success'),
        sqsRecordFactory('success'),
      ];
      const processor = new BatchProcessorSync(EventType.SQS);
      const event: SQSEvent = { Records: records };

      const handler = (
        event: SQSEvent,
        _context: Context
      ): PartialItemFailureResponse => {
        return processPartialResponseSync(event, sqsRecordHandler, processor);
      };

      // Act
      const result = handler(event, context);

      // Assess
      expect(result).toStrictEqual({ batchItemFailures: [] });
    });

    it('Process partial response through handler with Kinesis event', () => {
      // Prepare
      const records = [
        kinesisRecordFactory('success'),
        kinesisRecordFactory('success'),
      ];
      const processor = new BatchProcessorSync(EventType.KinesisDataStreams);
      const event: KinesisStreamEvent = { Records: records };

      const handler = (
        event: KinesisStreamEvent,
        _context: Context
      ): PartialItemFailureResponse => {
        return processPartialResponseSync(
          event,
          kinesisRecordHandler,
          processor
        );
      };

      // Act
      const result = handler(event, context);

      // Assess
      expect(result).toStrictEqual({ batchItemFailures: [] });
    });

    it('Process partial response through handler with DynamoDB event', () => {
      // Prepare
      const records = [
        dynamodbRecordFactory('success'),
        dynamodbRecordFactory('success'),
      ];
      const processor = new BatchProcessorSync(EventType.DynamoDBStreams);
      const event: DynamoDBStreamEvent = { Records: records };

      const handler = (
        event: DynamoDBStreamEvent,
        _context: Context
      ): PartialItemFailureResponse => {
        return processPartialResponseSync(
          event,
          dynamodbRecordHandler,
          processor
        );
      };

      // Act
      const result = handler(event, context);

      // Assess
      expect(result).toStrictEqual({ batchItemFailures: [] });
    });

    it('Process partial response through handler for SQS records with incorrect event type', () => {
      // Prepare
      const processor = new BatchProcessorSync(EventType.SQS);

      const handler = (
        event: SQSEvent,
        _context: Context
      ): PartialItemFailureResponse => {
        return processPartialResponseSync(event, sqsRecordHandler, processor);
      };

      try {
        // Act
        handler({} as unknown as SQSEvent, context);
      } catch (error) {
        // Assess
        expect(error).toBeInstanceOf(UnexpectedBatchTypeError);
        expect((error as Error).message).toBe(
          `Unexpected batch type. Possible values are: ${Object.keys(
            EventType
          ).join(', ')}`
        );
      }
    });

    it('Process partial response through handler with context provided', () => {
      // Prepare
      const records = [
        sqsRecordFactory('success'),
        sqsRecordFactory('success'),
      ];
      const processor = new BatchProcessorSync(EventType.SQS);
      const event: SQSEvent = { Records: records };

      const handler = (
        event: SQSEvent,
        context: Context
      ): PartialItemFailureResponse => {
        const options: BatchProcessingOptions = { context: context };

        return processPartialResponseSync(
          event,
          handlerWithContext,
          processor,
          options
        );
      };

      // Act
      const result = handler(event, context);

      // Assess
      expect(result).toStrictEqual({ batchItemFailures: [] });
    });

    it('Process partial response through handler for full batch failure', () => {
      // Prepare
      const records = [sqsRecordFactory('fail'), sqsRecordFactory('fail')];
      const processor = new BatchProcessorSync(EventType.SQS);
      const event: SQSEvent = { Records: records };

      const handler = (
        event: SQSEvent,
        _context: Context
      ): PartialItemFailureResponse => {
        return processPartialResponseSync(event, sqsRecordHandler, processor);
      };

      // Act & Assess
      expect(() => handler(event, context)).toThrow(FullBatchFailureError);
    });

    it('Process partial response through handler for full batch failure when `throwOnFullBatchFailure` is `true`', () => {
      // Prepare
      const records = [sqsRecordFactory('fail'), sqsRecordFactory('fail')];
      const processor = new BatchProcessorSync(EventType.SQS);
      const event: SQSEvent = { Records: records };

      const handler = (
        event: SQSEvent,
        _context: Context
      ): PartialItemFailureResponse => {
        return processPartialResponseSync(event, sqsRecordHandler, processor, {
          ...options,
          throwOnFullBatchFailure: true,
        });
      };

      // Act & Assess
      expect(() => handler(event, context)).toThrow(FullBatchFailureError);
    });

    it('Process partial response through handler for full batch failure when `throwOnFullBatchFailure` is `false`', () => {
      // Prepare
      const records = [sqsRecordFactory('fail'), sqsRecordFactory('fail')];
      const processor = new BatchProcessorSync(EventType.SQS);
      const event: SQSEvent = { Records: records };

      const handler = (
        event: SQSEvent,
        _context: Context
      ): PartialItemFailureResponse => {
        return processPartialResponseSync(event, sqsRecordHandler, processor, {
          ...options,
          throwOnFullBatchFailure: false,
        });
      };

      // Act
      const response = handler(event, context);

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

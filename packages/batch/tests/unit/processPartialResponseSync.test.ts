/**
 * Test processPartialResponse function
 *
 * @group unit/batch/function/processpartialresponse
 */
import type {
  Context,
  DynamoDBStreamEvent,
  KinesisStreamEvent,
  SQSEvent,
} from 'aws-lambda';
import {
  ContextExamples as dummyContext,
  Events as dummyEvent,
} from '@aws-lambda-powertools/commons';
import {
  BatchProcessorSync,
  processPartialResponseSync,
  EventType,
  UnexpectedBatchTypeError,
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
import assert from 'node:assert';

describe('Function: processPartialResponse()', () => {
  const ENVIRONMENT_VARIABLES = process.env;
  const context = dummyContext;
  const options: BatchProcessingOptions = {
    context: dummyContext.helloworldContext,
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
    test('Process partial response function call with synchronous handler', () => {
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

    test('Process partial response function call with context provided', () => {
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
  });

  describe('Process partial response function call through handler', () => {
    test('Process partial response through handler with SQS event', () => {
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
      const result = handler(event, context.helloworldContext);

      // Assess
      expect(result).toStrictEqual({ batchItemFailures: [] });
    });

    test('Process partial response through handler with Kinesis event', () => {
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
      const result = handler(event, context.helloworldContext);

      // Assess
      expect(result).toStrictEqual({ batchItemFailures: [] });
    });

    test('Process partial response through handler with DynamoDB event', () => {
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
      const result = handler(event, context.helloworldContext);

      // Assess
      expect(result).toStrictEqual({ batchItemFailures: [] });
    });

    test('Process partial response through handler for SQS records with incorrect event type', () => {
      // Prepare
      const processor = new BatchProcessorSync(EventType.SQS);
      const event = dummyEvent.Custom;

      const handler = (
        event: SQSEvent,
        _context: Context
      ): PartialItemFailureResponse => {
        return processPartialResponseSync(event, sqsRecordHandler, processor);
      };

      try {
        // Act
        handler(event as unknown as SQSEvent, context.helloworldContext);
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

    test('Process partial response through handler with context provided', () => {
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
      const result = handler(event, context.helloworldContext);

      // Assess
      expect(result).toStrictEqual({ batchItemFailures: [] });
    });
  });
});

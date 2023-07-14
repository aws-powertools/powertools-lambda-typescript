/**
 * Test processPartialResponse function
 *
 * @group unit/batch/function/processpartialresponse
 */

import {
  Context,
  DynamoDBStreamEvent,
  KinesisStreamEvent,
  SQSEvent,
} from 'aws-lambda';
import {
  BatchProcessingOptions,
  BatchProcessor,
  EventType,
  PartialItemFailureResponse,
  processPartialResponse,
} from '../../src';
import {
  dynamodbRecordFactory,
  kinesisRecordFactory,
  sqsRecordFactory,
} from '../../tests/helpers/factories';
import {
  asyncSqsRecordHandler,
  dynamodbRecordHandler,
  handlerWithContext,
  kinesisRecordHandler,
  sqsRecordHandler,
} from '../../tests/helpers/handlers';
import { helloworldContext as dummyContext } from '../../../commons/src/samples/resources/contexts';
import { Custom as dummyEvent } from '../../../commons/src/samples/resources/events';

describe('Function: processPartialResponse()', () => {
  const ENVIRONMENT_VARIABLES = process.env;
  const context = dummyContext;
  const options: BatchProcessingOptions = { context: dummyContext };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();
    process.env = { ...ENVIRONMENT_VARIABLES };
  });

  afterAll(() => {
    process.env = ENVIRONMENT_VARIABLES;
  });

  describe('Process partial response function call tests', () => {
    test('Process partial response function call with synchronous handler', async () => {
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
        sqsRecordHandler,
        processor
      );

      // Assess
      expect(ret).toStrictEqual({ batchItemFailures: [] });
    });

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
        handlerWithContext,
        processor,
        options
      );

      // Assess
      expect(ret).toStrictEqual({ batchItemFailures: [] });
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
        return await processPartialResponse(event, sqsRecordHandler, processor);
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
          kinesisRecordHandler,
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
          dynamodbRecordHandler,
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
      const event = dummyEvent;
      const eventTypes: string = Object.values(EventType).toString();

      const handler = async (
        event: SQSEvent,
        _context: Context
      ): Promise<PartialItemFailureResponse> => {
        return await processPartialResponse(event, sqsRecordHandler, processor);
      };

      // Act & Assess
      await expect(
        handler(event as unknown as SQSEvent, context)
      ).rejects.toThrowError(
        new Error(
          'Failed to convert event to record batch for processing.\nPlease ensure batch event is a valid ' +
            eventTypes +
            ' event.'
        )
      );
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
        _context: Context
      ): Promise<PartialItemFailureResponse> => {
        const options: BatchProcessingOptions = { context: _context };

        return await processPartialResponse(
          event,
          handlerWithContext,
          processor,
          options
        );
      };

      // Act
      const result = await handler(event, context);

      // Assess
      expect(result).toStrictEqual({ batchItemFailures: [] });
    });
  });
});

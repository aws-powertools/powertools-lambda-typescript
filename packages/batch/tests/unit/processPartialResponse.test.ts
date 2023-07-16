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
import { helloworldContext as dummyContext } from '../../../commons/src/samples/resources/contexts';
import { Custom as dummyEvent } from '../../../commons/src/samples/resources/events';
import { BatchProcessor, processPartialResponse } from '../../src';
import { EventType } from '../../src/constants';
import type {
  BatchProcessingOptions,
  PartialItemFailureResponse,
} from '../../src/types';
import {
  dynamodbRecordFactory,
  kinesisRecordFactory,
  sqsRecordFactory,
} from '../helpers/factories';
import {
  dynamodbRecordHandler,
  handlerWithContext,
  kinesisRecordHandler,
  sqsRecordHandler,
} from '../helpers/handlers';

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
    test('Process partial response function call with synchronous handler', () => {
      // Prepare
      const records = [
        sqsRecordFactory('success'),
        sqsRecordFactory('success'),
      ];
      const batch = { Records: records };
      const processor = new BatchProcessor(EventType.SQS);

      // Act
      const ret = processPartialResponse(batch, sqsRecordHandler, processor);

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
      const processor = new BatchProcessor(EventType.SQS);

      // Act
      const ret = processPartialResponse(
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
      const processor = new BatchProcessor(EventType.SQS);
      const event: SQSEvent = { Records: records };

      const handler = (
        event: SQSEvent,
        _context: Context
      ): PartialItemFailureResponse => {
        return processPartialResponse(event, sqsRecordHandler, processor);
      };

      // Act
      const result = handler(event, context);

      // Assess
      expect(result).toStrictEqual({ batchItemFailures: [] });
    });

    test('Process partial response through handler with Kinesis event', () => {
      // Prepare
      const records = [
        kinesisRecordFactory('success'),
        kinesisRecordFactory('success'),
      ];
      const processor = new BatchProcessor(EventType.KinesisDataStreams);
      const event: KinesisStreamEvent = { Records: records };

      const handler = (
        event: KinesisStreamEvent,
        _context: Context
      ): PartialItemFailureResponse => {
        return processPartialResponse(event, kinesisRecordHandler, processor);
      };

      // Act
      const result = handler(event, context);

      // Assess
      expect(result).toStrictEqual({ batchItemFailures: [] });
    });

    test('Process partial response through handler with DynamoDB event', () => {
      // Prepare
      const records = [
        dynamodbRecordFactory('success'),
        dynamodbRecordFactory('success'),
      ];
      const processor = new BatchProcessor(EventType.DynamoDBStreams);
      const event: DynamoDBStreamEvent = { Records: records };

      const handler = (
        event: DynamoDBStreamEvent,
        _context: Context
      ): PartialItemFailureResponse => {
        return processPartialResponse(event, dynamodbRecordHandler, processor);
      };

      // Act
      const result = handler(event, context);

      // Assess
      expect(result).toStrictEqual({ batchItemFailures: [] });
    });

    test('Process partial response through handler for SQS records with incorrect event type', () => {
      // Prepare
      const processor = new BatchProcessor(EventType.SQS);
      const event = dummyEvent;
      const eventTypes: string = Object.values(EventType).toString();

      const handler = (
        event: SQSEvent,
        _context: Context
      ): PartialItemFailureResponse => {
        return processPartialResponse(event, sqsRecordHandler, processor);
      };

      // Act & Assess
      expect(() => handler(event as unknown as SQSEvent, context)).toThrowError(
        new Error(
          'Failed to convert event to record batch for processing.\nPlease ensure batch event is a valid ' +
            eventTypes +
            ' event.'
        )
      );
    });

    test('Process partial response through handler with context provided', () => {
      // Prepare
      const records = [
        sqsRecordFactory('success'),
        sqsRecordFactory('success'),
      ];
      const processor = new BatchProcessor(EventType.SQS);
      const event: SQSEvent = { Records: records };

      const handler = (
        event: SQSEvent,
        context: Context
      ): PartialItemFailureResponse => {
        const options: BatchProcessingOptions = { context: context };

        return processPartialResponse(
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
  });
});

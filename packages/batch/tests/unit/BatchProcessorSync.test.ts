import context from '@aws-lambda-powertools/testing-utils/context';
import type { Context } from 'aws-lambda';
import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  BatchProcessingError,
  BatchProcessorSync,
  EventType,
  FullBatchFailureError,
} from '../../src/index.js';
import type { BatchProcessingOptions } from '../../src/types.js';
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

describe('Class: BatchProcessor', () => {
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

  describe('Synchronously processing SQS Records', () => {
    it('completes processing with no failures', () => {
      // Prepare
      const firstRecord = sqsRecordFactory('success');
      const secondRecord = sqsRecordFactory('success');
      const records = [firstRecord, secondRecord];
      const processor = new BatchProcessorSync(EventType.SQS);

      // Act
      processor.register(records, sqsRecordHandler);
      const processedMessages = processor.processSync();

      // Assess
      expect(processedMessages).toStrictEqual([
        ['success', firstRecord.body, firstRecord],
        ['success', secondRecord.body, secondRecord],
      ]);
    });

    it('completes processing with some failures', () => {
      // Prepare
      const firstRecord = sqsRecordFactory('failure');
      const secondRecord = sqsRecordFactory('success');
      const thirdRecord = sqsRecordFactory('fail');
      const records = [firstRecord, secondRecord, thirdRecord];
      const processor = new BatchProcessorSync(EventType.SQS);

      // Act
      processor.register(records, sqsRecordHandler);
      const processedMessages = processor.processSync();

      // Assess
      expect(processedMessages[1]).toStrictEqual([
        'success',
        secondRecord.body,
        secondRecord,
      ]);
      expect(processor.failureMessages.length).toBe(2);
      expect(processor.response()).toStrictEqual({
        batchItemFailures: [
          { itemIdentifier: firstRecord.messageId },
          { itemIdentifier: thirdRecord.messageId },
        ],
      });
    });

    it('completes processing with all failures', () => {
      // Prepare
      const firstRecord = sqsRecordFactory('failure');
      const secondRecord = sqsRecordFactory('failure');
      const thirdRecord = sqsRecordFactory('fail');

      const records = [firstRecord, secondRecord, thirdRecord];
      const processor = new BatchProcessorSync(EventType.SQS);

      // Act & Assess
      processor.register(records, sqsRecordHandler);
      expect(() => processor.processSync()).toThrowError(FullBatchFailureError);
    });
  });

  describe('Synchronously processing Kinesis Records', () => {
    it('completes processing with no failures', async () => {
      // Prepare
      const firstRecord = kinesisRecordFactory('success');
      const secondRecord = kinesisRecordFactory('success');
      const records = [firstRecord, secondRecord];
      const processor = new BatchProcessorSync(EventType.KinesisDataStreams);

      // Act
      processor.register(records, kinesisRecordHandler);
      const processedMessages = processor.processSync();

      // Assess
      expect(processedMessages).toStrictEqual([
        ['success', firstRecord.kinesis.data, firstRecord],
        ['success', secondRecord.kinesis.data, secondRecord],
      ]);
    });

    it('completes processing with some failures', async () => {
      // Prepare
      const firstRecord = kinesisRecordFactory('failure');
      const secondRecord = kinesisRecordFactory('success');
      const thirdRecord = kinesisRecordFactory('fail');
      const records = [firstRecord, secondRecord, thirdRecord];
      const processor = new BatchProcessorSync(EventType.KinesisDataStreams);

      // Act
      processor.register(records, kinesisRecordHandler);
      const processedMessages = processor.processSync();

      // Assess
      expect(processedMessages[1]).toStrictEqual([
        'success',
        secondRecord.kinesis.data,
        secondRecord,
      ]);
      expect(processor.failureMessages.length).toBe(2);
      expect(processor.response()).toStrictEqual({
        batchItemFailures: [
          { itemIdentifier: firstRecord.kinesis.sequenceNumber },
          { itemIdentifier: thirdRecord.kinesis.sequenceNumber },
        ],
      });
    });

    it('completes processing with all failures', async () => {
      const firstRecord = kinesisRecordFactory('failure');
      const secondRecord = kinesisRecordFactory('failure');
      const thirdRecord = kinesisRecordFactory('fail');

      const records = [firstRecord, secondRecord, thirdRecord];
      const processor = new BatchProcessorSync(EventType.KinesisDataStreams);

      // Act
      processor.register(records, kinesisRecordHandler);

      // Assess
      expect(() => processor.processSync()).toThrowError(FullBatchFailureError);
    });
  });

  describe('Synchronously processing DynamoDB Records', () => {
    it('completes processing with no failures', async () => {
      // Prepare
      const firstRecord = dynamodbRecordFactory('success');
      const secondRecord = dynamodbRecordFactory('success');
      const records = [firstRecord, secondRecord];
      const processor = new BatchProcessorSync(EventType.DynamoDBStreams);

      // Act
      processor.register(records, dynamodbRecordHandler);
      const processedMessages = processor.processSync();

      // Assess
      expect(processedMessages).toStrictEqual([
        ['success', firstRecord.dynamodb?.NewImage?.Message, firstRecord],
        ['success', secondRecord.dynamodb?.NewImage?.Message, secondRecord],
      ]);
    });

    it('completes processing with some failures', async () => {
      // Prepare
      const firstRecord = dynamodbRecordFactory('failure');
      const secondRecord = dynamodbRecordFactory('success');
      const thirdRecord = dynamodbRecordFactory('fail');
      const records = [firstRecord, secondRecord, thirdRecord];
      const processor = new BatchProcessorSync(EventType.DynamoDBStreams);

      // Act
      processor.register(records, dynamodbRecordHandler);
      const processedMessages = processor.processSync();

      // Assess
      expect(processedMessages[1]).toStrictEqual([
        'success',
        secondRecord.dynamodb?.NewImage?.Message,
        secondRecord,
      ]);
      expect(processor.failureMessages.length).toBe(2);
      expect(processor.response()).toStrictEqual({
        batchItemFailures: [
          { itemIdentifier: firstRecord.dynamodb?.SequenceNumber },
          { itemIdentifier: thirdRecord.dynamodb?.SequenceNumber },
        ],
      });
    });

    it('completes processing with all failures', async () => {
      // Prepare
      const firstRecord = dynamodbRecordFactory('failure');
      const secondRecord = dynamodbRecordFactory('failure');
      const thirdRecord = dynamodbRecordFactory('fail');

      const records = [firstRecord, secondRecord, thirdRecord];
      const processor = new BatchProcessorSync(EventType.DynamoDBStreams);

      // Act
      processor.register(records, dynamodbRecordHandler);

      // Assess
      expect(() => processor.processSync()).toThrowError(FullBatchFailureError);
    });
  });

  describe('Batch processing with Lambda context', () => {
    it('passes the context to the record handler', async () => {
      // Prepare
      const firstRecord = sqsRecordFactory('success');
      const secondRecord = sqsRecordFactory('success');
      const records = [firstRecord, secondRecord];
      const processor = new BatchProcessorSync(EventType.SQS);

      // Act
      processor.register(records, handlerWithContext, options);
      const processedMessages = processor.processSync();

      // Assess
      expect(processedMessages).toStrictEqual([
        ['success', firstRecord.body, firstRecord],
        ['success', secondRecord.body, secondRecord],
      ]);
    });

    it('throws an error when passing an invalid context object', async () => {
      // Prepare
      const firstRecord = sqsRecordFactory('success');
      const secondRecord = sqsRecordFactory('success');
      const records = [firstRecord, secondRecord];
      const processor = new BatchProcessorSync(EventType.SQS);

      // Act
      processor.register(records, sqsRecordHandler, options);
      const processedMessages = processor.processSync();

      // Assess
      expect(processedMessages).toStrictEqual([
        ['success', firstRecord.body, firstRecord],
        ['success', secondRecord.body, secondRecord],
      ]);
    });
  });

  it('throws an error when the async process method is called', async () => {
    // Prepare
    const processor = new BatchProcessorSync(EventType.SQS);

    // Act & Assess
    await expect(() => processor.process()).rejects.toThrowError(
      BatchProcessingError
    );
  });
});

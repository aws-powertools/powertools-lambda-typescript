import context from '@aws-lambda-powertools/testing-utils/context';
import type { Context } from 'aws-lambda';
import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  BatchProcessingError,
  BatchProcessor,
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
  asyncDynamodbRecordHandler,
  asyncHandlerWithContext,
  asyncKinesisRecordHandler,
  asyncSqsRecordHandler,
} from '../helpers/handlers.js';

describe('Class: AsyncBatchProcessor', () => {
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

  describe('Asynchronously processing', () => {
    const cases = [
      {
        description: 'in parallel',
        options: { processInParallel: true },
      },
      {
        description: 'sequentially',
        options: { processInParallel: false },
      },
    ];

    describe.each(cases)('SQS Records $description', ({ options }) => {
      it('completes processing with no failures', async () => {
        // Prepare
        const firstRecord = sqsRecordFactory('success');
        const secondRecord = sqsRecordFactory('success');
        const records = [firstRecord, secondRecord];
        const processor = new BatchProcessor(EventType.SQS);

        // Act
        processor.register(records, asyncSqsRecordHandler, options);
        const processedMessages = await processor.process();

        // Assess
        expect(processedMessages).toStrictEqual([
          ['success', firstRecord.body, firstRecord],
          ['success', secondRecord.body, secondRecord],
        ]);
      });

      it('completes processing with with some failures', async () => {
        // Prepare
        const firstRecord = sqsRecordFactory('failure');
        const secondRecord = sqsRecordFactory('success');
        const thirdRecord = sqsRecordFactory('fail');
        const records = [firstRecord, secondRecord, thirdRecord];
        const processor = new BatchProcessor(EventType.SQS);

        // Act
        processor.register(records, asyncSqsRecordHandler, options);
        const processedMessages = await processor.process();

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

      it('completes processing with all failures', async () => {
        // Prepare
        const firstRecord = sqsRecordFactory('failure');
        const secondRecord = sqsRecordFactory('failure');
        const thirdRecord = sqsRecordFactory('fail');

        const records = [firstRecord, secondRecord, thirdRecord];
        const processor = new BatchProcessor(EventType.SQS);

        // Act
        processor.register(records, asyncSqsRecordHandler, options);

        // Assess
        await expect(processor.process()).rejects.toThrowError(
          FullBatchFailureError
        );
      });
    });

    describe.each(cases)('Kinesis Records $description', ({ options }) => {
      it('completes processing with no failures', async () => {
        // Prepare
        const firstRecord = kinesisRecordFactory('success');
        const secondRecord = kinesisRecordFactory('success');
        const records = [firstRecord, secondRecord];
        const processor = new BatchProcessor(EventType.KinesisDataStreams);

        // Act
        processor.register(records, asyncKinesisRecordHandler, options);
        const processedMessages = await processor.process();

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
        const processor = new BatchProcessor(EventType.KinesisDataStreams);

        // Act
        processor.register(records, asyncKinesisRecordHandler, options);
        const processedMessages = await processor.process();

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
        // Prepare
        const firstRecord = kinesisRecordFactory('failure');
        const secondRecord = kinesisRecordFactory('failure');
        const thirdRecord = kinesisRecordFactory('fail');

        const records = [firstRecord, secondRecord, thirdRecord];
        const processor = new BatchProcessor(EventType.KinesisDataStreams);

        // Act
        processor.register(records, asyncKinesisRecordHandler, options);

        // Assess
        await expect(processor.process()).rejects.toThrowError(
          FullBatchFailureError
        );
      });
    });

    describe.each(cases)('DynamoDB Records $description', ({ options }) => {
      it('completes processing with no failures', async () => {
        // Prepare
        const firstRecord = dynamodbRecordFactory('success');
        const secondRecord = dynamodbRecordFactory('success');
        const records = [firstRecord, secondRecord];
        const processor = new BatchProcessor(EventType.DynamoDBStreams);

        // Act
        processor.register(records, asyncDynamodbRecordHandler, options);
        const processedMessages = await processor.process();

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
        const processor = new BatchProcessor(EventType.DynamoDBStreams);

        // Act
        processor.register(records, asyncDynamodbRecordHandler, options);
        const processedMessages = await processor.process();

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
        const processor = new BatchProcessor(EventType.DynamoDBStreams);

        // Act
        processor.register(records, asyncDynamodbRecordHandler, options);

        // Assess
        await expect(processor.process()).rejects.toThrowError(
          FullBatchFailureError
        );
      });
    });
  });

  describe('Batch processing with Lambda context', () => {
    it('passes the context to the record handler', async () => {
      // Prepare
      const firstRecord = sqsRecordFactory('success');
      const secondRecord = sqsRecordFactory('success');
      const records = [firstRecord, secondRecord];
      const processor = new BatchProcessor(EventType.SQS);

      // Act
      processor.register(records, asyncHandlerWithContext, options);
      const processedMessages = await processor.process();

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
      const processor = new BatchProcessor(EventType.SQS);
      const badContext = { foo: 'bar' };
      const badOptions = { context: badContext as unknown as Context };

      // Act
      processor.register(records, asyncHandlerWithContext, badOptions);
      await expect(() => processor.process()).rejects.toThrowError(
        FullBatchFailureError
      );
    });
  });

  it('throws an error when the sync process method is called', () => {
    // Prepare
    const processor = new BatchProcessor(EventType.SQS);

    // Act & Assess
    expect(() => processor.processSync()).toThrowError(BatchProcessingError);
  });
});

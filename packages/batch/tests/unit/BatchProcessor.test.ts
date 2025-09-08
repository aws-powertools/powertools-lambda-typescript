import {
  Base64Encoded,
  JSONStringified,
} from '@aws-lambda-powertools/parser/helpers';
import { DynamoDBMarshalled } from '@aws-lambda-powertools/parser/helpers/dynamodb';
import {
  KinesisDataStreamRecord,
  SqsRecordSchema,
} from '@aws-lambda-powertools/parser/schemas';
import {
  DynamoDBStreamChangeRecordBase,
  DynamoDBStreamRecord,
} from '@aws-lambda-powertools/parser/schemas/dynamodb';
import { KinesisDataStreamRecordPayload } from '@aws-lambda-powertools/parser/schemas/kinesis';
import context from '@aws-lambda-powertools/testing-utils/context';
import type {
  Context,
  DynamoDBRecord,
  KinesisStreamRecord,
  SQSRecord,
} from 'aws-lambda';
import * as v from 'valibot';
import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { z } from 'zod';
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

  describe('Batch processing with Parser Integration', () => {
    const customSchema = z.object({
      Message: z.string(),
    });
    const successPayload1 = {
      Message: 'test-1',
    };
    const successPayload2 = {
      Message: 'test-2',
    };
    const failurePayload1 = {
      Message: 1,
    };
    const failurePayload2 = {
      Message: 2,
    };
    const sqsRecordHandler = async (parsedRecord: SQSRecord) => {
      return parsedRecord.body;
    };
    const kinesisRecordHandler = async (parsedRecord: KinesisStreamRecord) => {
      return parsedRecord.kinesis.data;
    };
    const dynamodbRecordHandler = async (parsedRecord: DynamoDBRecord) => {
      return parsedRecord.dynamodb?.NewImage;
    };
    const cases = [
      {
        description: 'passing Extended Schema',
        SQS: {
          schema: SqsRecordSchema.extend({
            body: JSONStringified(customSchema),
          }),
        },
        Kinesis: {
          schema: KinesisDataStreamRecord.extend({
            kinesis: KinesisDataStreamRecordPayload.extend({
              data: Base64Encoded(customSchema).optional(),
            }),
          }),
        },
        DynamoDB: {
          schema: DynamoDBStreamRecord.extend({
            dynamodb: DynamoDBStreamChangeRecordBase.extend({
              NewImage: DynamoDBMarshalled(customSchema).optional(),
            }),
          }),
        },
      },
      {
        description: 'passing Internal Schema without transformers',
        SQS: {
          schema: customSchema,
        },
        Kinesis: {
          schema: customSchema,
        },
        DynamoDB: {
          schema: customSchema,
        },
      },
      {
        description: 'passing Internal Schema with transformers',
        SQS: {
          schema: JSONStringified(customSchema),
        },
        Kinesis: {
          schema: Base64Encoded(customSchema),
        },
        DynamoDB: {
          schema: DynamoDBMarshalled(customSchema),
        },
      },
    ];
    describe.each(cases)('SQS Record Schema $description', ({ SQS }) => {
      it('completes the processing with no failures and parses the payload before passing to the record handler', async () => {
        // Prepare
        const firstRecord = sqsRecordFactory(JSON.stringify(successPayload1));
        const secondRecord = sqsRecordFactory(JSON.stringify(successPayload2));
        const records = [firstRecord, secondRecord];
        const processor = new BatchProcessor(EventType.SQS, {
          schema: SQS.schema,
        });

        // Act
        processor.register(records, sqsRecordHandler, options);
        const processedMessages = await processor.process();

        // Assess
        expect(processedMessages).toStrictEqual([
          ['success', successPayload1, firstRecord],
          ['success', successPayload2, secondRecord],
        ]);
      });

      it('completes the processing with failures if some of the payload does not match the passed schema', async () => {
        // Prepare
        const firstRecord = sqsRecordFactory(JSON.stringify(successPayload1));
        const secondRecord = sqsRecordFactory(JSON.stringify(failurePayload1));
        const records = [firstRecord, secondRecord];
        const processor = new BatchProcessor(EventType.SQS, {
          schema: SQS.schema,
        });

        // Act
        processor.register(records, sqsRecordHandler, options);
        const processedMessages = await processor.process();

        // Assess
        expect(processedMessages[0]).toStrictEqual([
          'success',
          successPayload1,
          firstRecord,
        ]);
        expect(processor.failureMessages.length).toBe(1);
        expect(processor.response()).toStrictEqual({
          batchItemFailures: [{ itemIdentifier: secondRecord.messageId }],
        });
      });

      it('completes processing with all failures if all the payload does not match the passed schema', async () => {
        // Prepare
        const firstRecord = sqsRecordFactory(JSON.stringify(failurePayload1));
        const secondRecord = sqsRecordFactory(JSON.stringify(failurePayload2));

        const records = [firstRecord, secondRecord];
        const processor = new BatchProcessor(EventType.SQS, {
          schema: SQS.schema,
        });

        // Act
        processor.register(records, sqsRecordHandler, options);

        // Assess
        await expect(processor.process()).rejects.toThrowError(
          FullBatchFailureError
        );
      });
    });

    describe.each(cases)(
      'Kinesis Record Schema $description',
      ({ Kinesis }) => {
        it('completes the processing with no failures and parses the payload before passing to the record handler', async () => {
          // Prepare
          const firstRecord = kinesisRecordFactory(
            Buffer.from(JSON.stringify(successPayload1)).toString('base64')
          );
          const secondRecord = kinesisRecordFactory(
            Buffer.from(JSON.stringify(successPayload2)).toString('base64')
          );
          const records = [firstRecord, secondRecord];
          const processor = new BatchProcessor(EventType.KinesisDataStreams, {
            schema: Kinesis.schema,
          });

          // Act
          processor.register(records, kinesisRecordHandler, options);
          const processedMessages = await processor.process();

          // Assess
          expect(processedMessages).toStrictEqual([
            ['success', successPayload1, firstRecord],
            ['success', successPayload2, secondRecord],
          ]);
        });

        it('completes the processing with failures if some of the payload does not match the passed schema', async () => {
          // Prepare
          const firstRecord = kinesisRecordFactory(
            Buffer.from(JSON.stringify(successPayload1)).toString('base64')
          );
          const secondRecord = kinesisRecordFactory(
            Buffer.from(JSON.stringify(failurePayload1)).toString('base64')
          );
          const records = [firstRecord, secondRecord];
          const processor = new BatchProcessor(EventType.KinesisDataStreams, {
            schema: Kinesis.schema,
          });

          // Act
          processor.register(records, kinesisRecordHandler, options);
          const processedMessages = await processor.process();

          // Assess
          expect(processedMessages[0]).toStrictEqual([
            'success',
            successPayload1,
            firstRecord,
          ]);
          expect(processor.failureMessages.length).toBe(1);
          expect(processor.response()).toStrictEqual({
            batchItemFailures: [
              { itemIdentifier: secondRecord.kinesis.sequenceNumber },
            ],
          });
        });

        it('completes processing with all failures if all the payload does not match the passed schema', async () => {
          // Prepare
          const firstRecord = kinesisRecordFactory(
            Buffer.from(JSON.stringify(failurePayload1)).toString('base64')
          );
          const secondRecord = kinesisRecordFactory(
            Buffer.from(JSON.stringify(failurePayload2)).toString('base64')
          );

          const records = [firstRecord, secondRecord];
          const processor = new BatchProcessor(EventType.KinesisDataStreams, {
            schema: Kinesis.schema,
          });

          // Act
          processor.register(records, sqsRecordHandler, options);

          // Assess
          await expect(processor.process()).rejects.toThrowError(
            FullBatchFailureError
          );
        });
      }
    );

    describe.each(cases)(
      'DynamoDB Record Schema $description',
      ({ DynamoDB }) => {
        it('completes the processing with no failures and parses the payload before passing to the record handler', async () => {
          // Prepare
          const firstRecord = dynamodbRecordFactory(successPayload1.Message);
          const secondRecord = dynamodbRecordFactory(successPayload2.Message);
          const records = [firstRecord, secondRecord];
          const processor = new BatchProcessor(EventType.DynamoDBStreams, {
            schema: DynamoDB.schema,
          });

          // Act
          processor.register(records, dynamodbRecordHandler, options);
          const processedMessages = await processor.process();

          // Assess
          expect(processedMessages).toStrictEqual([
            ['success', successPayload1, firstRecord],
            ['success', successPayload2, secondRecord],
          ]);
        });

        it('completes the processing with failures if some of the payload does not match the passed schema', async () => {
          // Prepare
          const firstRecord = dynamodbRecordFactory(successPayload1.Message);
          //@ts-expect-error Passing an invalid payload for testing
          const secondRecord = dynamodbRecordFactory(failurePayload1.Message);
          const records = [firstRecord, secondRecord];
          const processor = new BatchProcessor(EventType.DynamoDBStreams, {
            schema: DynamoDB.schema,
          });

          // Act
          processor.register(records, dynamodbRecordHandler, options);
          const processedMessages = await processor.process();

          // Assess
          expect(processedMessages[0]).toStrictEqual([
            'success',
            successPayload1,
            firstRecord,
          ]);
          expect(processor.failureMessages.length).toBe(1);
          expect(processor.response()).toStrictEqual({
            batchItemFailures: [
              { itemIdentifier: secondRecord.dynamodb?.SequenceNumber },
            ],
          });
        });

        it('completes processing with all failures if all the payload does not match the passed schema', async () => {
          // Prepare
          //@ts-expect-error Passing an invalid payload for testing
          const firstRecord = dynamodbRecordFactory(failurePayload1.Message);
          //@ts-expect-error Passing an invalid payload for testing
          const secondRecord = dynamodbRecordFactory(failurePayload2.Message);
          const records = [firstRecord, secondRecord];
          const processor = new BatchProcessor(EventType.DynamoDBStreams, {
            schema: DynamoDB.schema,
          });

          // Act
          processor.register(records, dynamodbRecordHandler, options);

          // Assess
          await expect(processor.process()).rejects.toThrowError(
            FullBatchFailureError
          );
        });
      }
    );

    it('completes processing with all failures if an unsupported event type is used for parsing', async () => {
      // Prepare
      const firstRecord = sqsRecordFactory(JSON.stringify(successPayload1));
      const secondRecord = sqsRecordFactory(JSON.stringify(successPayload2));
      const records = [firstRecord, secondRecord];
      //@ts-expect-error
      const processor = new BatchProcessor('invalid-event-type', {
        schema: customSchema,
      });

      // Act
      processor.register(records, sqsRecordHandler, options);

      // Assess
      await expect(processor.process()).rejects.toThrowError(
        FullBatchFailureError
      );
    });

    it('completes processing with failures if an unsupported schema type is used for parsing', async () => {
      // Prepare
      const unsupportedSchema = v.object({
        Message: v.string(),
      });
      const firstRecord = sqsRecordFactory(JSON.stringify(successPayload1));
      const secondRecord = sqsRecordFactory(JSON.stringify(successPayload2));
      const records = [firstRecord, secondRecord];
      const processor = new BatchProcessor(EventType.SQS, {
        schema: unsupportedSchema,
      });

      // Act
      processor.register(records, sqsRecordHandler, options);

      // Assess
      await expect(processor.process()).rejects.toThrowError(
        FullBatchFailureError
      );
    });
  });
});

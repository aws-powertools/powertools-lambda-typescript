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
import type {
  DynamoDBRecord,
  KinesisStreamRecord,
  SQSRecord,
} from 'aws-lambda';
import { object, string } from 'valibot';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { z } from 'zod';
import {
  BatchProcessor,
  EventType,
  FullBatchFailureError,
} from '../../src/index.js';
import { parser } from '../../src/parser.js';
import {
  dynamodbRecordFactory,
  kinesisRecordFactory,
  sqsRecordFactory,
} from '../helpers/factories.js';

describe('Batch processing with Parser Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });
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
      SQSParserConfig: {
        parser,
        schema: SqsRecordSchema.extend({
          body: JSONStringified(customSchema),
        }),
      },
      KinesisParserConfig: {
        parser,
        schema: KinesisDataStreamRecord.extend({
          kinesis: KinesisDataStreamRecordPayload.extend({
            data: Base64Encoded(customSchema).optional(),
          }),
        }),
      },
      DynamoDBParserConfig: {
        parser,
        schema: DynamoDBStreamRecord.extend({
          dynamodb: DynamoDBStreamChangeRecordBase.extend({
            NewImage: DynamoDBMarshalled(customSchema).optional(),
          }),
        }),
      },
    },
    {
      description: 'passing Internal Schema without transformer property set',
      SQSParserConfig: {
        parser,
        innerSchema: JSONStringified(customSchema),
      },
      KinesisParserConfig: {
        parser,
        innerSchema: Base64Encoded(customSchema),
      },
      DynamoDBParserConfig: {
        parser,
        innerSchema: DynamoDBMarshalled(customSchema),
      },
    },
    {
      description: 'passing Internal Schema with transformer property set',
      SQSParserConfig: {
        parser,
        innerSchema: customSchema,
        transformer: 'json' as const,
      },
      KinesisParserConfig: {
        parser,
        innerSchema: customSchema,
        transformer: 'base64' as const,
      },
      DynamoDBParserConfig: {
        parser,
        innerSchema: customSchema,
        transformer: 'unmarshall' as const,
      },
    },
  ];
  describe.each(cases)(
    'SQS Record Schema $description',
    ({ SQSParserConfig }) => {
      it('completes the processing with no failures and parses the payload before passing to the record handler', async () => {
        // Prepare
        const firstRecord = sqsRecordFactory(JSON.stringify(successPayload1));
        const secondRecord = sqsRecordFactory(JSON.stringify(successPayload2));
        const records = [firstRecord, secondRecord];
        const processor = new BatchProcessor(EventType.SQS, SQSParserConfig);

        // Act
        processor.register(records, sqsRecordHandler);
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
        const processor = new BatchProcessor(EventType.SQS, SQSParserConfig);

        // Act
        processor.register(records, sqsRecordHandler);
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
    }
  );

  describe.each(cases)(
    'Kinesis Record Schema $description',
    ({ KinesisParserConfig }) => {
      it('completes the processing with no failures and parses the payload before passing to the record handler', async () => {
        // Prepare
        const firstRecord = kinesisRecordFactory(
          Buffer.from(JSON.stringify(successPayload1)).toString('base64')
        );
        const secondRecord = kinesisRecordFactory(
          Buffer.from(JSON.stringify(successPayload2)).toString('base64')
        );
        const records = [firstRecord, secondRecord];
        const processor = new BatchProcessor(
          EventType.KinesisDataStreams,
          KinesisParserConfig
        );

        // Act
        processor.register(records, kinesisRecordHandler);
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
        const processor = new BatchProcessor(
          EventType.KinesisDataStreams,
          KinesisParserConfig
        );

        // Act
        processor.register(records, kinesisRecordHandler);
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
    }
  );

  describe.each(cases)(
    'DynamoDB Record Schema $description',
    ({ DynamoDBParserConfig }) => {
      it('completes the processing with no failures and parses the payload before passing to the record handler', async () => {
        // Prepare
        const firstRecord = dynamodbRecordFactory(successPayload1.Message);
        const secondRecord = dynamodbRecordFactory(successPayload2.Message);
        const records = [firstRecord, secondRecord];
        const processor = new BatchProcessor(
          EventType.DynamoDBStreams,
          DynamoDBParserConfig
        );

        // Act
        processor.register(records, dynamodbRecordHandler);
        const processedMessages = await processor.process();

        // Assess
        expect(processedMessages).toStrictEqual([
          ['success', successPayload1, firstRecord],
          ['success', successPayload2, secondRecord],
        ]);
      });

      it('completes the processing with failures if some of the payload does not match the passed schema', async () => {
        // Prepare
        vi.stubEnv('AWS_LAMBDA_LOG_LEVEL', 'DEBUG');
        const firstRecord = dynamodbRecordFactory(successPayload1.Message);
        //@ts-expect-error Passing an invalid payload for testing
        const secondRecord = dynamodbRecordFactory(failurePayload1.Message);
        const records = [firstRecord, secondRecord];
        const processor = new BatchProcessor(EventType.DynamoDBStreams, {
          ...DynamoDBParserConfig,
          logger: console,
        });

        // Act
        processor.register(records, dynamodbRecordHandler);
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
        expect(console.debug).toHaveBeenCalledWith(
          'dynamodb.NewImage.Message: Invalid input: expected string, received number'
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
      innerSchema: customSchema,
      transformer: 'json',
    });

    // Act
    processor.register(records, sqsRecordHandler);

    // Assess
    await expect(processor.process()).rejects.toThrowError(
      FullBatchFailureError
    );
  });

  it('completes processing with failures if an unsupported schema type is used for parsing', async () => {
    // Prepare
    const unsupportedSchema = object({
      Message: string(),
    });
    const firstRecord = sqsRecordFactory(JSON.stringify(successPayload1));
    const secondRecord = sqsRecordFactory(JSON.stringify(successPayload2));
    const records = [firstRecord, secondRecord];
    const processor = new BatchProcessor(EventType.SQS, {
      parser,
      // @ts-expect-error - we are explicitly testing a wrong schema vendor
      innerSchema: unsupportedSchema,
      transformer: 'json',
    });

    // Act
    processor.register(records, sqsRecordHandler);

    // Assess
    await expect(processor.process()).rejects.toThrowError(
      FullBatchFailureError
    );
  });

  it('completes processing with failures if the schema is not passed for the parsing', async () => {
    // Prepare
    const firstRecord = sqsRecordFactory(JSON.stringify(successPayload1));
    const secondRecord = sqsRecordFactory(JSON.stringify(successPayload2));
    const records = [firstRecord, secondRecord];

    const processor = new BatchProcessor(EventType.SQS, {
      parser,
      transformer: 'json',
    });

    // Act
    processor.register(records, sqsRecordHandler);

    // Assess
    await expect(processor.process()).rejects.toThrowError(
      FullBatchFailureError
    );
  });

  it('uses a custom logger when provided', async () => {
    // Prepare
    const logger = {
      debug: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
    };
    const unsupportedSchema = object({
      Message: string(),
    });
    const firstRecord = sqsRecordFactory(JSON.stringify(successPayload1));
    const secondRecord = sqsRecordFactory(JSON.stringify(successPayload2));
    const records = [firstRecord, secondRecord];
    const processor = new BatchProcessor(EventType.SQS, {
      parser,
      // @ts-expect-error - we are explicitly testing a wrong schema vendor
      innerSchema: unsupportedSchema,
      transformer: 'json',
      logger,
    });

    // Act
    processor.register(records, sqsRecordHandler);

    // Assess
    await expect(processor.process()).rejects.toThrowError(
      FullBatchFailureError
    );
    expect(logger.error).toHaveBeenCalledWith(
      'The schema provided is not supported. Only Zod schemas are supported for extension.'
    );
  });
});

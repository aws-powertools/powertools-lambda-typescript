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
  const sqsRecordHandler = async (parsedRecord: SQSRecord) => parsedRecord.body;
  const sqsRecords = [
    sqsRecordFactory(JSON.stringify(successPayload1)),
    sqsRecordFactory(JSON.stringify(successPayload2)),
  ];
  const kinesisRecordHandler = async (parsedRecord: KinesisStreamRecord) =>
    parsedRecord.kinesis.data;
  const kinesisRecords = [
    kinesisRecordFactory(
      Buffer.from(JSON.stringify(successPayload1)).toString('base64')
    ),
    kinesisRecordFactory(
      Buffer.from(JSON.stringify(successPayload2)).toString('base64')
    ),
  ];
  const dynamodbRecordHandler = async (parsedRecord: DynamoDBRecord) =>
    parsedRecord.dynamodb?.NewImage;
  const dynamodbRecords = [
    dynamodbRecordFactory(successPayload1.Message),
    dynamodbRecordFactory(successPayload2.Message),
  ];

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
    const processor = new BatchProcessor(EventType.SQS, {
      parser,
      innerSchema: unsupportedSchema,
      transformer: 'json',
      logger,
    });
    processor.register(sqsRecords, sqsRecordHandler);

    // Act & Assess
    await expect(processor.process()).rejects.toThrowError(
      FullBatchFailureError
    );
    expect(logger.error).toHaveBeenCalledWith(
      'The schema provided is not supported. Only Zod schemas are supported for extension.'
    );
  });

  it('completes processing with failures if the schema is not passed for the parsing', async () => {
    // Prepare
    vi.stubEnv('AWS_LAMBDA_LOG_LEVEL', 'INFO');
    // @ts-expect-error - testing missing required params
    const processor = new BatchProcessor(EventType.SQS, {
      parser,
      transformer: 'json',
    });
    processor.register(sqsRecords, sqsRecordHandler);

    // Act & Assess
    await expect(processor.process()).rejects.toThrowError(
      FullBatchFailureError
    );
  });

  it('does not log debug logs if the lambda log level is set to higher than INFO', async () => {
    // Prepare
    vi.stubEnv('AWS_LAMBDA_LOG_LEVEL', 'INFO');
    const processor = new BatchProcessor(EventType.SQS, {
      parser,
      innerSchema: customSchema,
      transformer: 'json',
    });
    processor.register([sqsRecordFactory('fail')], sqsRecordHandler);

    // Act & Assess
    await expect(processor.process()).rejects.toThrowError(
      FullBatchFailureError
    );
    expect(console.debug).not.toHaveBeenCalled();
  });

  it('reports the parsing error if the record does not conform to the schema', async () => {
    // Prepare
    vi.stubEnv('AWS_LAMBDA_LOG_LEVEL', 'DEBUG');
    const records = [sqsRecordFactory(JSON.stringify({ Invalid: 'invalid' }))];
    const processor = new BatchProcessor(EventType.SQS, {
      parser,
      innerSchema: customSchema,
      transformer: 'json',
      logger: console,
    });
    processor.register(records, sqsRecordHandler, {
      throwOnFullBatchFailure: false,
    });

    // Act
    const result = await processor.process();

    // Assess
    expect(console.debug).toHaveBeenCalledWith(
      'Failed to parse record: body.Message: Invalid input: expected string, received undefined'
    );
    expect(result).toEqual([
      [
        'fail',
        'body.Message: Invalid input: expected string, received undefined',
        records[0],
      ],
    ]);
  });

  it.each([
    {
      case: 'full schema',
      records: sqsRecords,
      params: {
        schema: SqsRecordSchema.extend({
          body: JSONStringified(customSchema),
        }),
      },
    },
    {
      case: 'inner schema',
      records: sqsRecords,
      params: {
        innerSchema: JSONStringified(customSchema),
      },
    },
    {
      case: 'inner schema with transformer',
      records: sqsRecords,
      params: {
        innerSchema: customSchema,
        transformer: 'json' as const,
      },
    },
  ])('processes SQS records with $case', async ({ records, params }) => {
    // Prepare
    const processor = new BatchProcessor(EventType.SQS, {
      parser,
      ...params,
    });
    processor.register(records, sqsRecordHandler);

    // Act
    const result = await processor.process();

    // Assess
    expect(result).toEqual([
      ['success', successPayload1, sqsRecords[0]],
      ['success', successPayload2, sqsRecords[1]],
    ]);
  });

  it.each([
    {
      case: 'full schema',
      records: kinesisRecords,
      params: {
        schema: KinesisDataStreamRecord.extend({
          kinesis: KinesisDataStreamRecordPayload.extend({
            data: Base64Encoded(customSchema),
          }),
        }),
      },
    },
    {
      case: 'inner schema',
      records: kinesisRecords,
      params: {
        innerSchema: Base64Encoded(customSchema),
      },
    },
    {
      case: 'inner schema with transformer',
      records: kinesisRecords,
      params: {
        innerSchema: customSchema,
        transformer: 'base64' as const,
      },
    },
  ])('processes Kinesis records with $case', async ({ records, params }) => {
    // Prepare
    const processor = new BatchProcessor(EventType.KinesisDataStreams, {
      parser,
      ...params,
    });
    processor.register(records, kinesisRecordHandler);

    // Act
    const result = await processor.process();

    // Assess
    expect(result).toEqual([
      ['success', successPayload1, kinesisRecords[0]],
      ['success', successPayload2, kinesisRecords[1]],
    ]);
  });

  it.each([
    {
      case: 'full schema',
      records: dynamodbRecords,
      params: {
        schema: DynamoDBStreamRecord.extend({
          dynamodb: DynamoDBStreamChangeRecordBase.extend({
            NewImage: DynamoDBMarshalled(customSchema),
          }),
        }),
      },
    },
    {
      case: 'inner schema',
      records: dynamodbRecords,
      params: {
        innerSchema: DynamoDBMarshalled(customSchema),
      },
    },
    {
      case: 'inner schema with transformer',
      records: dynamodbRecords,
      params: {
        innerSchema: customSchema,
        transformer: 'unmarshall' as const,
      },
    },
  ])('processes DynamoDB records with $case', async ({ records, params }) => {
    // Prepare
    const processor = new BatchProcessor(EventType.DynamoDBStreams, {
      parser,
      ...params,
    });
    processor.register(records, dynamodbRecordHandler);

    // Act
    const result = await processor.process();

    // Assess
    expect(result).toEqual([
      ['success', successPayload1, dynamodbRecords[0]],
      ['success', successPayload2, dynamodbRecords[1]],
    ]);
  });
});

import type { Context } from 'aws-lambda';
import type {
  DynamoDBRecord,
  KinesisStreamRecord,
  SQSRecord,
} from 'aws-lambda';

/**
 * Test handler for SQS records.
 *
 * Used for testing the SQS batch processor with a synchronous handler.
 *
 * @param record The SQS record to process.
 */
const sqsRecordHandler = (record: SQSRecord): string => {
  const body = record.body;
  if (body.includes('fail')) {
    throw Error('Failed to process record.');
  }

  return body;
};

/**
 * Test handler for SQS records.
 *
 * Used for testing the SQS batch processor with an asynchronous handler.
 *
 * @param record The SQS record to process.
 */
const asyncSqsRecordHandler = async (record: SQSRecord): Promise<string> => {
  const body = record.body;
  if (body.includes('fail')) {
    throw Error('Failed to process record.');
  }

  return Promise.resolve(body);
};

/**
 * Test handler for Kinesis records.
 *
 * Used for testing the Kinesis batch processor with a synchronous handler.
 *
 * @param record The Kinesis record to process.
 */
const kinesisRecordHandler = (record: KinesisStreamRecord): string => {
  const body = record.kinesis.data;
  if (body.includes('fail')) {
    throw Error('Failed to process record.');
  }

  return body;
};

/**
 * Test handler for Kinesis records.
 *
 * Used for testing the Kinesis batch processor with an asynchronous handler.
 *
 * @param record The Kinesis record to process.
 */
const asyncKinesisRecordHandler = async (
  record: KinesisStreamRecord
): Promise<string> => {
  const body = record.kinesis.data;
  if (body.includes('fail')) {
    throw Error('Failed to process record.');
  }

  return Promise.resolve(body);
};

/**
 * Test handler for DynamoDB records.
 *
 * Used for testing the DynamoDB batch processor with a synchronous handler.
 *
 * @param record The DynamoDB record to process.
 */
const dynamodbRecordHandler = (record: DynamoDBRecord): object => {
  const body = record.dynamodb?.NewImage?.Message || { S: 'fail' };
  if (body['S']?.includes('fail')) {
    throw Error('Failed to process record.');
  }

  return body;
};

/**
 * Test handler for DynamoDB records.
 *
 * Used for testing the DynamoDB batch processor with an asynchronous handler.
 *
 * @param record The DynamoDB record to process.
 */
const asyncDynamodbRecordHandler = async (
  record: DynamoDBRecord
): Promise<object> => {
  const body = record.dynamodb?.NewImage?.Message || { S: 'fail' };
  if (body['S']?.includes('fail')) {
    throw Error('Failed to process record.');
  }

  return Promise.resolve(body);
};

/**
 * Test handler for SQS records.
 *
 * Used for testing the SQS batch processor with a synchronous handler, it
 * also tests that the context object is passed to the handler.
 *
 * @param record The SQS record to process.
 * @param context The AWS Lambda context object passed to the handler.
 */
const handlerWithContext = (record: SQSRecord, context: Context): string => {
  try {
    if (context.getRemainingTimeInMillis() == 0) {
      throw Error('No time remaining.');
    }
  } catch (e) {
    throw Error('Context possibly malformed. Displaying context:\n' + context);
  }

  return record.body;
};

/**
 * Test handler for SQS records.
 *
 * Used for testing the SQS batch processor with a asynchronous handler, it
 * also tests that the context object is passed to the handler.
 *
 * @param record The SQS record to process.
 * @param context The AWS Lambda context object passed to the handler.
 */
const asyncHandlerWithContext = async (
  record: SQSRecord,
  context: Context
): Promise<string> => {
  try {
    if (context.getRemainingTimeInMillis() == 0) {
      throw Error('No time remaining.');
    }
  } catch (e) {
    throw Error('Context possibly malformed. Displaying context:\n' + context);
  }

  return Promise.resolve(record.body);
};

export {
  sqsRecordHandler,
  asyncSqsRecordHandler,
  kinesisRecordHandler,
  asyncKinesisRecordHandler,
  dynamodbRecordHandler,
  asyncDynamodbRecordHandler,
  handlerWithContext,
  asyncHandlerWithContext,
};

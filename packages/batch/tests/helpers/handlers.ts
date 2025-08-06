import type {
  Context,
  DynamoDBRecord,
  KinesisStreamRecord,
  SQSRecord,
} from 'aws-lambda';

const baseSqsHandler = (record: SQSRecord): string => {
  const body = record.body;
  if (body.includes('fail')) {
    throw Error('Failed to process record.');
  }

  return body;
};

const sqsRecordHandler = baseSqsHandler;
const asyncSqsRecordHandler = async (record: SQSRecord): Promise<string> =>
  Promise.resolve(baseSqsHandler(record));

const baseKinesisHandler = (record: KinesisStreamRecord): string => {
  const body = record.kinesis.data;
  if (body.includes('fail')) {
    throw Error('Failed to process record.');
  }

  return body;
};

const kinesisRecordHandler = baseKinesisHandler;
const asyncKinesisRecordHandler = async (
  record: KinesisStreamRecord
): Promise<string> => Promise.resolve(baseKinesisHandler(record));

const baseDynamodbHandler = (record: DynamoDBRecord): object => {
  const body = record.dynamodb?.NewImage?.Message || { S: 'fail' };
  if (body.S?.includes('fail')) {
    throw Error('Failed to process record.');
  }

  return body;
};

const dynamodbRecordHandler = baseDynamodbHandler;
const asyncDynamodbRecordHandler = async (
  record: DynamoDBRecord
): Promise<object> => {
  return Promise.resolve(baseDynamodbHandler(record));
};

const baseHandlerWithContext = (
  record: SQSRecord,
  context: Context
): string => {
  try {
    if (context.getRemainingTimeInMillis() === 0) {
      throw Error('No time remaining.');
    }
  } catch {
    throw Error(`Context possibly malformed. Displaying context:\n${context}`);
  }

  return record.body;
};

const handlerWithContext = baseHandlerWithContext;
const asyncHandlerWithContext = async (
  record: SQSRecord,
  context: Context
): Promise<string> => {
  return Promise.resolve(baseHandlerWithContext(record, context));
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

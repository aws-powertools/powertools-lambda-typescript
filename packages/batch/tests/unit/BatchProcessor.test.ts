/**
 * Test BatchProcessor class
 *
 * @group unit/batch/class/batchprocessor
 */
import { DynamoDBRecord, KinesisStreamRecord, SQSRecord } from 'aws-lambda';
import { BatchProcessingError, BatchProcessor, EventType } from '../../src';
import { v4 } from 'uuid';

const sqsEventFactory = (body: string): SQSRecord => {
  return {
    "messageId": v4(),
    "receiptHandle": "AQEBwJnKyrHigUMZj6rYigCgxlaS3SLy0a",
    "body": body,
    "attributes": {
        "ApproximateReceiveCount": "1",
        "SentTimestamp": "1545082649183",
        "SenderId": "AIDAIENQZJOLO23YVJ4VO",
        "ApproximateFirstReceiveTimestamp": "1545082649185",
    },
    "messageAttributes": {},
    "md5OfBody": "e4e68fb7bd0e697a0ae8f1bb342846b3",
    "eventSource": "aws:sqs",
    "eventSourceARN": "arn:aws:sqs:us-east-2:123456789012:my-queue",
    "awsRegion": "us-east-1",
  }
};

const kinesisEventFactory = (body: string): KinesisStreamRecord => {
  let seq: string = "";
  for (var i = 0; i < 52; i++) {
    seq = seq + Math.floor(Math.random() * 10);
  }
  return {
      "kinesis": {
          "kinesisSchemaVersion": "1.0",
          "partitionKey": "1",
          "sequenceNumber": seq,
          "data": body,
          "approximateArrivalTimestamp": 1545084650.987,
      },
      "eventSource": "aws:kinesis",
      "eventVersion": "1.0",
      "eventID": "shardId-000000000006:" + seq,
      "eventName": "aws:kinesis:record",
      "invokeIdentityArn": "arn:aws:iam::123456789012:role/lambda-role",
      "awsRegion": "us-east-2",
      "eventSourceARN": "arn:aws:kinesis:us-east-2:123456789012:stream/lambda-stream",
  }
};

const dynamodbEventFactory = (body: string): DynamoDBRecord => {
  let seq: string = "";
  for (var i = 0; i < 10; i++) {
    seq = seq + Math.floor(Math.random() * 10);
  }
  return {
    "eventID": "1",
    "eventVersion": "1.0",
    "dynamodb": {
        "Keys": {"Id": {"N": "101"}},
        "NewImage": {"Message": {"S": body}},
        "StreamViewType": "NEW_AND_OLD_IMAGES",
        "SequenceNumber": seq,
        "SizeBytes": 26,
    },
    "awsRegion": "us-west-2",
    "eventName": "INSERT",
    "eventSourceARN": "eventsource_arn",
    "eventSource": "aws:dynamodb",
  }
};

const sqsRecordHandler = (record: SQSRecord): Object => {
  let body = record.body;
  if (body.includes("fail")) {
    throw Error("Failed to process record.");
  }
  return body;
};

const asyncSqsRecordHandler = async (record: SQSRecord): Promise<Object> => {
  let body = record.body;
  if (body.includes("fail")) {
    throw Error("Failed to process record.");
  }
  return body;
};

const kinesisRecordHandler = (record: KinesisStreamRecord): Object => {
  let body = record.kinesis.data;
  if (body.includes("fail")) {
    throw Error("Failed to process record.");
  }
  return body;
};

const asyncKinesisRecordHandler = async (record: KinesisStreamRecord): Promise<Object> => {
  let body = record.kinesis.data;
  if (body.includes("fail")) {
    throw Error("Failed to process record.");
  }
  return body;
};

const dynamodbRecordHandler = (record: DynamoDBRecord): Object => {
  let body = record.dynamodb?.NewImage?.Message || {"S": "fail"};
  if (body["S"]?.includes("fail")) {
    throw Error("Failed to process record.");
  }
  return body;
};

const asyncDynamodbRecordHandler = async (record: DynamoDBRecord): Promise<Object> => {
  let body = await record.dynamodb?.NewImage?.Message || {"S": "fail"};
  if (body["S"]?.includes("fail")) {
    throw Error("Failed to process record.");
  }
  return body;
};

describe('Class: BatchProcessor', () => {
  const ENVIRONMENT_VARIABLES = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();
    process.env = { ...ENVIRONMENT_VARIABLES };
  });

  afterAll(() => {
    process.env = ENVIRONMENT_VARIABLES;
  });

  describe('Synchronously processing SQS Records', () => {
    test('Batch processing SQS records with no failures', async () => {    
      // Prepare
      let firstRecord = sqsEventFactory("success");
      let secondRecord = sqsEventFactory("success");
      let records = [firstRecord, secondRecord];
      let processor = new BatchProcessor(EventType.SQS);

      // Act
      processor.register(records, sqsRecordHandler);
      let processedMessages = await processor.process();

      // Assess
      expect(processedMessages).toStrictEqual([["success", (firstRecord as SQSRecord).body, firstRecord], 
                                                ["success", (secondRecord as SQSRecord).body, secondRecord]]);
    });
    
    test('Batch processing SQS records with some failures', async () => {
      // Prepare
      let firstRecord = sqsEventFactory("failure");
      let secondRecord = sqsEventFactory("success");
      let thirdRecord = sqsEventFactory("fail");
      let records = [firstRecord, secondRecord, thirdRecord];
      let processor = new BatchProcessor(EventType.SQS);

      // Act
      processor.register(records, sqsRecordHandler);
      let processedMessages = await processor.process();

      // Asses
      expect(processedMessages[1]).toStrictEqual(["success", (secondRecord as SQSRecord).body, secondRecord]);
      expect(processor.failureMessages.length).toBe(2);
      expect(processor.response()).toStrictEqual(
        {"batchItemFailures": 
          [{"itemIdentifier": (firstRecord as SQSRecord).messageId}, 
          {"itemIdentifier": (thirdRecord as SQSRecord).messageId}]
        },
      );
    });
  
    test('Batch processing SQS records with all failures', async () => {
      // Prepare
      let firstRecord = sqsEventFactory("failure");
      let secondRecord = sqsEventFactory("failure");
      let thirdRecord = sqsEventFactory("fail");

      let records = [firstRecord, secondRecord, thirdRecord];
      let processor = new BatchProcessor(EventType.SQS);

      // Act & Assess
      processor.register(records, sqsRecordHandler);
      await expect(processor.process()).rejects.toThrowError(BatchProcessingError);
    });
  });

  describe('Asynchronously processing SQS Records', () => {
    test('Batch processing SQS records with no failures', async () => {
      // Prepare
      let firstRecord = sqsEventFactory("success");
      let secondRecord = sqsEventFactory("success");
      let records = [firstRecord, secondRecord];
      let processor = new BatchProcessor(EventType.SQS);

      // Act
      processor.register(records, asyncSqsRecordHandler);
      let processedMessages = await processor.process();

      // Assess
      expect(processedMessages).toStrictEqual([["success", (firstRecord as SQSRecord).body, firstRecord], 
                                                ["success", (secondRecord as SQSRecord).body, secondRecord]]);
    });

    test('Batch processing SQS records with failures', async () => {
      // Prepare
      let firstRecord = sqsEventFactory("failure");
      let secondRecord = sqsEventFactory("success");
      let thirdRecord = sqsEventFactory("fail");
      let records = [firstRecord, secondRecord, thirdRecord];
      let processor = new BatchProcessor(EventType.SQS);

      // Act
      processor.register(records, asyncSqsRecordHandler);
      let processedMessages = await processor.process();

      // Assess
      expect(processedMessages[1]).toStrictEqual(["success", (secondRecord as SQSRecord).body, secondRecord]);
      expect(processor.failureMessages.length).toBe(2);
      expect(processor.response()).toStrictEqual(
        {"batchItemFailures": 
          [{"itemIdentifier": (firstRecord as SQSRecord).messageId}, 
          {"itemIdentifier": (thirdRecord as SQSRecord).messageId}]
        }
      );
    });

    test('Batch processing SQS records with all failures', async () => {
      // Prepare
      let firstRecord = sqsEventFactory("failure");
      let secondRecord = sqsEventFactory("failure");
      let thirdRecord = sqsEventFactory("fail");

      let records = [firstRecord, secondRecord, thirdRecord];
      let processor = new BatchProcessor(EventType.SQS);

      // Act
      processor.register(records, asyncSqsRecordHandler);

      // Assess
      await expect(processor.process()).rejects.toThrowError(BatchProcessingError);
    });
  });

  describe('Synchronously processing Kinesis Records', () => {
    test('Batch processing Kinesis records with no failures', async () => {
      // Prepare
      let firstRecord = kinesisEventFactory("success");
      let secondRecord = kinesisEventFactory("success");
      let records = [firstRecord, secondRecord];
      let processor = new BatchProcessor(EventType.KinesisDataStreams);

      // Act
      processor.register(records, kinesisRecordHandler);
      let processedMessages = await processor.process();

      // Assess
      expect(processedMessages).toStrictEqual([["success", (firstRecord as KinesisStreamRecord).kinesis.data, firstRecord], 
                                                ["success", (secondRecord as KinesisStreamRecord).kinesis.data, secondRecord]]);
    });

    test('Batch processing Kinesis records with failures', async () => {
      // Prepare
      let firstRecord = kinesisEventFactory("failure");
      let secondRecord = kinesisEventFactory("success");
      let thirdRecord = kinesisEventFactory("fail");
      let records = [firstRecord, secondRecord, thirdRecord];
      let processor = new BatchProcessor(EventType.KinesisDataStreams);

      // Act
      processor.register(records, kinesisRecordHandler);
      let processedMessages = await processor.process();

      // Assess
      expect(processedMessages[1]).toStrictEqual(["success", (secondRecord as KinesisStreamRecord).kinesis.data, secondRecord]);
      expect(processor.failureMessages.length).toBe(2);
      expect(processor.response()).toStrictEqual(
        {"batchItemFailures": 
          [{"itemIdentifier": (firstRecord as KinesisStreamRecord).kinesis.sequenceNumber}, 
          {"itemIdentifier": (thirdRecord as KinesisStreamRecord).kinesis.sequenceNumber}]
        }
      );
    });

    test('Batch processing Kinesis records with all failures', async () => {
      let firstRecord = kinesisEventFactory("failure");
      let secondRecord = kinesisEventFactory("failure");
      let thirdRecord = kinesisEventFactory("fail");

      let records = [firstRecord, secondRecord, thirdRecord];
      let processor = new BatchProcessor(EventType.KinesisDataStreams);

      // Act
      processor.register(records, kinesisRecordHandler);

      // Assess
      await expect(processor.process()).rejects.toThrowError(BatchProcessingError);
    });
  });

  describe('Asynchronously processing Kinesis Records', () => {
    test('Batch processing Kinesis records with no failures', async () => {
      // Prepare
      let firstRecord = kinesisEventFactory("success");
      let secondRecord = kinesisEventFactory("success");
      let records = [firstRecord, secondRecord];
      let processor = new BatchProcessor(EventType.KinesisDataStreams);

      // Act
      processor.register(records, asyncKinesisRecordHandler);
      let processedMessages = await processor.process();

      // Assess
      expect(processedMessages).toStrictEqual([["success", (firstRecord as KinesisStreamRecord).kinesis.data, firstRecord], 
                                                ["success", (secondRecord as KinesisStreamRecord).kinesis.data, secondRecord]]);
    });

    test('Batch processing Kinesis records with failures', async () => {
      // Prepare
      let firstRecord = kinesisEventFactory("failure");
      let secondRecord = kinesisEventFactory("success");
      let thirdRecord = kinesisEventFactory("fail");
      let records = [firstRecord, secondRecord, thirdRecord];
      let processor = new BatchProcessor(EventType.KinesisDataStreams);

      // Act
      processor.register(records, asyncKinesisRecordHandler);
      let processedMessages = await processor.process();

      // Assess
      expect(processedMessages[1]).toStrictEqual(["success", (secondRecord as KinesisStreamRecord).kinesis.data, secondRecord]);
      expect(processor.failureMessages.length).toBe(2);
      expect(processor.response()).toStrictEqual(
        {"batchItemFailures": 
          [{"itemIdentifier": (firstRecord as KinesisStreamRecord).kinesis.sequenceNumber}, 
          {"itemIdentifier": (thirdRecord as KinesisStreamRecord).kinesis.sequenceNumber}]
        }
      );
    });

    test('Batch processing Kinesis records with all failures', async () => {
      // Prepare
      let firstRecord = kinesisEventFactory("failure");
      let secondRecord = kinesisEventFactory("failure");
      let thirdRecord = kinesisEventFactory("fail");

      let records = [firstRecord, secondRecord, thirdRecord];
      let processor = new BatchProcessor(EventType.KinesisDataStreams);

      // Act
      processor.register(records, asyncKinesisRecordHandler);

      // Assess
      await expect(processor.process()).rejects.toThrowError(BatchProcessingError);
    });
  });  

  describe('Synchronously processing DynamoDB Records', () => {
    test('Batch processing DynamoDB records with no failures', async () => {
      // Prepare
      let firstRecord = dynamodbEventFactory("success");
      let secondRecord = dynamodbEventFactory("success");
      let records = [firstRecord, secondRecord];
      let processor = new BatchProcessor(EventType.DynamoDBStreams);

      // Act
      processor.register(records, dynamodbRecordHandler);
      let processedMessages = await processor.process();

      // Assess
      expect(processedMessages).toStrictEqual([["success", (firstRecord as DynamoDBRecord).dynamodb?.NewImage?.Message, firstRecord], 
                                                ["success", (secondRecord as DynamoDBRecord).dynamodb?.NewImage?.Message, secondRecord]]);
    });

    test('Batch processing DynamoDB records with failures', async () => {
      // Prepare
      let firstRecord = dynamodbEventFactory("failure");
      let secondRecord = dynamodbEventFactory("success");
      let thirdRecord = dynamodbEventFactory("fail");
      let records = [firstRecord, secondRecord, thirdRecord];
      let processor = new BatchProcessor(EventType.DynamoDBStreams);

      // Act
      processor.register(records, dynamodbRecordHandler);
      let processedMessages = await processor.process();

      // Assess
      expect(processedMessages[1]).toStrictEqual(["success", (secondRecord as DynamoDBRecord).dynamodb?.NewImage?.Message, secondRecord]);
      expect(processor.failureMessages.length).toBe(2);
      expect(processor.response()).toStrictEqual(
        {"batchItemFailures": 
          [{"itemIdentifier": (firstRecord as DynamoDBRecord).dynamodb?.SequenceNumber}, 
          {"itemIdentifier": (thirdRecord as DynamoDBRecord).dynamodb?.SequenceNumber}]
        }
      );
    });

    test('Batch processing DynamoDB records with all failures', async () => {
      // Prepare
      let firstRecord = dynamodbEventFactory("failure");
      let secondRecord = dynamodbEventFactory("failure");
      let thirdRecord = dynamodbEventFactory("fail");

      let records = [firstRecord, secondRecord, thirdRecord];
      let processor = new BatchProcessor(EventType.DynamoDBStreams);

      // Act
      processor.register(records, dynamodbRecordHandler);

      // Assess
      await expect(processor.process()).rejects.toThrowError(BatchProcessingError);
    });
  });

  describe('Asynchronously processing DynamoDB Records', () => {
    test('Batch processing DynamoDB records with no failures', async () => {
      // Prepare
      let firstRecord = dynamodbEventFactory("success");
      let secondRecord = dynamodbEventFactory("success");
      let records = [firstRecord, secondRecord];
      let processor = new BatchProcessor(EventType.DynamoDBStreams);

      // Act
      processor.register(records, asyncDynamodbRecordHandler);
      let processedMessages = await processor.process();

      // Assess
      expect(processedMessages).toStrictEqual([["success", (firstRecord as DynamoDBRecord).dynamodb?.NewImage?.Message, firstRecord], 
                                                ["success", (secondRecord as DynamoDBRecord).dynamodb?.NewImage?.Message, secondRecord]]);
    });

    test('Batch processing DynamoDB records with failures', async () => {
      // Prepare
      let firstRecord = dynamodbEventFactory("failure");
      let secondRecord = dynamodbEventFactory("success");
      let thirdRecord = dynamodbEventFactory("fail");
      let records = [firstRecord, secondRecord, thirdRecord];
      let processor = new BatchProcessor(EventType.DynamoDBStreams);

      // Act
      processor.register(records, asyncDynamodbRecordHandler);
      let processedMessages = await processor.process();

      // Assess
      expect(processedMessages[1]).toStrictEqual(["success", (secondRecord as DynamoDBRecord).dynamodb?.NewImage?.Message, secondRecord]);
      expect(processor.failureMessages.length).toBe(2);
      expect(processor.response()).toStrictEqual(
        {"batchItemFailures": 
          [{"itemIdentifier": (firstRecord as DynamoDBRecord).dynamodb?.SequenceNumber}, 
          {"itemIdentifier": (thirdRecord as DynamoDBRecord).dynamodb?.SequenceNumber}]
        }
      );
    });

    test('Batch processing DynamoDB records with all failures', async () => {
      // Prepare
      let firstRecord = dynamodbEventFactory("failure");
      let secondRecord = dynamodbEventFactory("failure");
      let thirdRecord = dynamodbEventFactory("fail");

      let records = [firstRecord, secondRecord, thirdRecord];
      let processor = new BatchProcessor(EventType.DynamoDBStreams);

      // Act
      processor.register(records, asyncDynamodbRecordHandler);

      // Assess
      await expect(processor.process()).rejects.toThrowError(BatchProcessingError);
    });
  });
});

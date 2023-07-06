import { DynamoDBRecord, KinesisStreamRecord, SQSRecord } from 'aws-lambda';

export const sqsRecordHandler = (record: SQSRecord): string => {
    let body = record.body;
    if (body.includes("fail")) {
      throw Error("Failed to process record.");
    }
    return body;
};

export const asyncSqsRecordHandler = async (record: SQSRecord): Promise<string> => {
    let body = record.body;
    if (body.includes("fail")) {
      throw Error("Failed to process record.");
    }
    return body;
};

export const kinesisRecordHandler = (record: KinesisStreamRecord): string => {
    let body = record.kinesis.data;
    if (body.includes("fail")) {
      throw Error("Failed to process record.");
    }
    return body;
};

export const asyncKinesisRecordHandler = async (record: KinesisStreamRecord): Promise<string> => {
    let body = record.kinesis.data;
    if (body.includes("fail")) {
      throw Error("Failed to process record.");
    }
    return body;
};

export const dynamodbRecordHandler = (record: DynamoDBRecord): object => {
    let body = record.dynamodb?.NewImage?.Message || {"S": "fail"};
    if (body["S"]?.includes("fail")) {
      throw Error("Failed to process record.");
    }
    return body;
};

export const asyncDynamodbRecordHandler = async (record: DynamoDBRecord): Promise<object> => {
    let body = await record.dynamodb?.NewImage?.Message || {"S": "fail"};
    if (body["S"]?.includes("fail")) {
      throw Error("Failed to process record.");
    }
    return body;
};
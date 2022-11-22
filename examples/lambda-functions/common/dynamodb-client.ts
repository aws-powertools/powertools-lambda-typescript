import { DynamoDBClient, ScanCommand, GetItemCommand, PutItemCommand } from '@aws-sdk/client-dynamodb';

const dynamodbClientV3 = new DynamoDBClient({});

export {
  dynamodbClientV3,
  ScanCommand,
  GetItemCommand,
  PutItemCommand
};
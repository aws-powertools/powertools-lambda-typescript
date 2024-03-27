import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';
import { tracer } from '#powertools';

// Create DynamoDB Client and patch it for tracing
const ddbClient = tracer.captureAWSv3Client(new DynamoDBClient({}));

// Create the DynamoDB Document client.
const docClient = DynamoDBDocumentClient.from(ddbClient, {
  marshallOptions: {
    removeUndefinedValues: true,
  },
});

export { ddbClient, docClient };

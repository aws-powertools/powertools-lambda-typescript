import { DynamoDBProvider } from '@aws-lambda-powertools/parameters/dynamodb';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';

// construct your clients with any custom configuration
const dynamoDBClient = new DynamoDBClient({ region: 'us-east-1' });
// pass the client to the provider
const valuesProvider = new DynamoDBProvider({
  tableName: 'my-table',
  awsSdkV3Client: dynamoDBClient,
});

export const handler = async (): Promise<void> => {
  // Retrieve a single value
  const value = await valuesProvider.get('my-value');
  console.log(value);
};

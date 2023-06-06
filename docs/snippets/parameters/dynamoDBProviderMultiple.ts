import { DynamoDBProvider } from '@aws-lambda-powertools/parameters/dynamodb';

const dynamoDBProvider = new DynamoDBProvider({ tableName: 'my-table' });

export const handler = async (): Promise<void> => {
  /**
   * Retrieve multiple values by performing a Query on the DynamoDB table.
   * This returns a dict with the sort key attribute as dict key.
   */
  const values = await dynamoDBProvider.getMultiple('my-hash-key');
  for (const [key, value] of Object.entries(values || {})) {
    // key: param-a
    // value: my-value-a
    console.log(`${key}: ${value}`);
  }
};

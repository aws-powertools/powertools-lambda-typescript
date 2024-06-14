import { DynamoDBProvider } from '@aws-lambda-powertools/parameters/dynamodb';

const dynamoDBProvider = new DynamoDBProvider({
  tableName: 'my-table',
  keyAttr: 'key',
  sortAttr: 'sort',
  valueAttr: 'val',
});

export const handler = async (): Promise<void> => {
  const value = await dynamoDBProvider.get('my-parameter');
  console.log(value);
};

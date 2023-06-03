import { handler } from './testingYourCodeFunction';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';

describe('Function tests', () => {
  test('it returns the correct response', async () => {
    // Prepare
    const ddbClient = new DynamoDBClient({
      endpoint: 'http://localhost:8000',
    });

    // TODO: patch the ddb client

    // Act
    const result = await handler({}, {});

    // Assess
    expect(result).toStrictEqual({
      paymentId: 12345,
      message: 'success',
      statusCode: 200,
    });
  });
});

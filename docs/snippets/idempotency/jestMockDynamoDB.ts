import { handler } from './testingYourCodeFunction';
import {
  DynamoDBClient,
  GetItemCommand,
  ResourceNotFoundException,
} from '@aws-sdk/client-dynamodb';
import { mockClient } from 'aws-sdk-client-mock';
import 'aws-sdk-client-mock-jest';

describe('Function tests', () => {
  const client = mockClient(DynamoDBClient);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    client.reset();
  });

  test('it returns the correct response', async () => {
    // Prepare
    client.on(GetItemCommand).rejectsOnce(
      new ResourceNotFoundException({
        $metadata: {
          httpStatusCode: 404,
        },
        message: 'Unable to find table',
      })
    );

    // TODO: test this test

    // Act
    const result = await handler({}, {});

    // Assess
    expect(result).toStrictEqual({ message: 'Unable to find table' });
  });
});

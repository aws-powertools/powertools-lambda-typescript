import {
  GetSecretValueCommand,
  ResourceNotFoundException,
  SecretsManagerClient,
} from '@aws-sdk/client-secrets-manager';
import { mockClient } from 'aws-sdk-client-mock';
import { handler } from './testingYourCodeFunctionsHandler';
import 'aws-sdk-client-mock-jest';

describe('Function tests', () => {
  const client = mockClient(SecretsManagerClient);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    client.reset();
  });

  test('it returns the correct error message', async () => {
    // Prepare
    client.on(GetSecretValueCommand).rejectsOnce(
      new ResourceNotFoundException({
        $metadata: {
          httpStatusCode: 404,
        },
        message: 'Unable to retrieve secret',
      })
    );

    // Act
    const result = await handler({}, {});

    // Assess
    expect(result).toStrictEqual({ message: 'Unable to retrieve secret' });
  });
});

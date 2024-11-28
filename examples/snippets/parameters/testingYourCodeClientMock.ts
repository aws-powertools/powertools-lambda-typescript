import {
  GetSecretValueCommand,
  ResourceNotFoundException,
  SecretsManagerClient,
} from '@aws-sdk/client-secrets-manager';
import { mockClient } from 'aws-sdk-client-mock';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { handler } from './testingYourCodeFunctionsHandler.js';
import 'aws-sdk-client-mock-vitest';

describe('Function tests', () => {
  const client = mockClient(SecretsManagerClient);

  afterEach(() => {
    vi.clearAllMocks();
    client.reset();
  });

  it('returns the correct error message', async () => {
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

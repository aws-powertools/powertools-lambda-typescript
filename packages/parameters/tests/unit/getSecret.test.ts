/**
 * Test getSecret function
 *
 * @group unit/parameters/SecretsProvider/getSecret/function
 */
import { DEFAULT_PROVIDERS } from '../../src/BaseProvider';
import { SecretsProvider, getSecret } from '../../src/secrets';
import { SecretsManagerClient, GetSecretValueCommand } from '@aws-sdk/client-secrets-manager';
import { mockClient } from 'aws-sdk-client-mock';
import 'aws-sdk-client-mock-jest';

const encoder = new TextEncoder();

describe('Function: getSecret', () => {

  const client = mockClient(SecretsManagerClient);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('when called and a default provider doesn\'t exist, it instantiates one and returns the value', async () => {

    // Prepare
    const secretName = 'foo';
    const secretValue = 'bar';
    client.on(GetSecretValueCommand).resolves({
      SecretString: secretValue,
    });

    // Act
    const result = await getSecret(secretName);

    // Assess
    expect(client).toReceiveCommandWith(GetSecretValueCommand, { SecretId: secretName });
    expect(result).toBe(secretValue);

  });

  test('when called and a default provider exists, it uses it and returns the value', async () => {

    // Prepare
    const provider = new SecretsProvider();
    DEFAULT_PROVIDERS.secrets = provider;
    const secretName = 'foo';
    const secretValue = 'bar';
    const binary = encoder.encode(secretValue);
    client.on(GetSecretValueCommand).resolves({
      SecretBinary: binary,
    });

    // Act
    const result = await getSecret(secretName);

    // Assess
    expect(client).toReceiveCommandWith(GetSecretValueCommand, { SecretId: secretName });
    expect(result).toStrictEqual(binary);
    expect(DEFAULT_PROVIDERS.secrets).toBe(provider);

  });

});
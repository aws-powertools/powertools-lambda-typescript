/**
 * Test getSecret function
 *
 * @group unit/parameters/SecretsProvider/getSecret/function
 */
import {
  GetSecretValueCommand,
  SecretsManagerClient,
} from '@aws-sdk/client-secrets-manager';
import { mockClient } from 'aws-sdk-client-mock';
import { DEFAULT_PROVIDERS } from '../../src/base/index.js';
import { SecretsProvider, getSecret } from '../../src/secrets/index.js';
import 'aws-sdk-client-mock-jest';

const encoder = new TextEncoder();

describe('Function: getSecret', () => {
  const client = mockClient(SecretsManagerClient);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('when called and a default provider does not exist, it instantiates one and returns the value', async () => {
    // Prepare
    const secretName = 'foo';
    const secretValue = 'bar';
    client.on(GetSecretValueCommand).resolves({
      SecretString: secretValue,
    });

    // Act
    const result: string | Uint8Array | undefined = await getSecret(secretName);

    // Assess
    expect(client).toReceiveCommandWith(GetSecretValueCommand, {
      SecretId: secretName,
    });
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
    const result: string | Uint8Array | undefined = await getSecret(secretName);

    // Assess
    expect(client).toReceiveCommandWith(GetSecretValueCommand, {
      SecretId: secretName,
    });
    expect(result).toStrictEqual(binary);
    expect(DEFAULT_PROVIDERS.secrets).toBe(provider);
  });

  test('when called and transform `JSON` is specified, it returns an object with correct type', async () => {
    // Prepare
    const provider = new SecretsProvider();
    DEFAULT_PROVIDERS.secrets = provider;
    const secretName = 'foo';
    const secretValue = JSON.stringify({ hello: 'world' });
    const client = mockClient(SecretsManagerClient)
      .on(GetSecretValueCommand)
      .resolves({
        SecretString: secretValue,
      });

    // Act
    const value: Record<string, unknown> | undefined = await getSecret(
      secretName,
      { transform: 'json' }
    );

    // Assess
    expect(client).toReceiveCommandWith(GetSecretValueCommand, {
      SecretId: secretName,
    });
    expect(value).toStrictEqual(JSON.parse(secretValue));
  });

  test('when called and transform `JSON` is specified as well as an explicit `K` type, it returns a result with correct type', async () => {
    // Prepare
    const provider = new SecretsProvider();
    DEFAULT_PROVIDERS.secrets = provider;
    const secretName = 'foo';
    const secretValue = JSON.stringify(5);
    const client = mockClient(SecretsManagerClient)
      .on(GetSecretValueCommand)
      .resolves({
        SecretString: secretValue,
      });

    // Act
    const value: number | undefined = await getSecret<number>(secretName, {
      transform: 'json',
    });

    // Assess
    expect(client).toReceiveCommandWith(GetSecretValueCommand, {
      SecretId: secretName,
    });
    expect(value).toBe(JSON.parse(secretValue));
  });
});

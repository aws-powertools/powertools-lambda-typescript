import {
  GetSecretValueCommand,
  SecretsManagerClient,
} from '@aws-sdk/client-secrets-manager';
import { mockClient } from 'aws-sdk-client-mock';
import { beforeEach, describe, expect, it } from 'vitest';
import { DEFAULT_PROVIDERS } from '../../src/base/index.js';
import { SecretsProvider, getSecret } from '../../src/secrets/index.js';

const encoder = new TextEncoder();

describe('Function: getSecret', () => {
  const client = mockClient(SecretsManagerClient);

  beforeEach(() => {
    client.reset();
  });

  it('instantiates a new client and returns the value when no default provider exists', async () => {
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

  it('uses the cached provider when one is present in the cache', async () => {
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
});

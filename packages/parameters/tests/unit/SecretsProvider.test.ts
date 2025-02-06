import { addUserAgentMiddleware } from '@aws-lambda-powertools/commons';
import {
  GetSecretValueCommand,
  SecretsManagerClient,
} from '@aws-sdk/client-secrets-manager';
import type { GetSecretValueCommandInput } from '@aws-sdk/client-secrets-manager';
import { mockClient } from 'aws-sdk-client-mock';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SecretsProvider } from '../../src/secrets/index.js';
import type { SecretsProviderOptions } from '../../src/types/SecretsProvider.js';

const encoder = new TextEncoder();
vi.mock('@aws-lambda-powertools/commons', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@aws-lambda-powertools/commons')>()),
  addUserAgentMiddleware: vi.fn(),
}));

describe('Class: SecretsProvider', () => {
  const client = mockClient(SecretsManagerClient);

  beforeEach(() => {
    client.reset();
  });

  describe('Method: constructor', () => {
    it('instantiates a new AWS SDK with default options', async () => {
      // Prepare
      const options: SecretsProviderOptions = {};

      // Act
      const provider = new SecretsProvider(options);

      // Assess
      expect(provider.client.config).toEqual(
        expect.objectContaining({
          serviceId: 'Secrets Manager',
        })
      );
      expect(addUserAgentMiddleware).toHaveBeenCalled();
    });

    it('uses the provided config to instantiate a new AWS SDK', async () => {
      // Prepare
      const options: SecretsProviderOptions = {
        clientConfig: {
          region: 'eu-south-2',
        },
      };

      // Act
      const provider = new SecretsProvider(options);

      // Assess
      await expect(provider.client.config.region()).resolves.toEqual(
        'eu-south-2'
      );
      expect(addUserAgentMiddleware).toHaveBeenCalled();
    });

    it('uses the provided AWS SDK client', async () => {
      // Prepare
      const awsSdkV3Client = new SecretsManagerClient({
        endpoint: 'http://localhost:3000',
        serviceId: 'Foo',
      });

      const options: SecretsProviderOptions = {
        awsSdkV3Client: awsSdkV3Client,
      };

      // Act
      const provider = new SecretsProvider(options);

      // Assess
      expect(provider.client).toEqual(awsSdkV3Client);
      expect(addUserAgentMiddleware).toHaveBeenCalledWith(
        awsSdkV3Client,
        'parameters'
      );
    });

    it('falls back on a new SDK client and logs a warning when an unknown object is provided instead of a client', async () => {
      // Prepare
      const awsSdkV3Client = {};
      const options: SecretsProviderOptions = {
        awsSdkV3Client: awsSdkV3Client as SecretsManagerClient,
      };

      // Act
      const provider = new SecretsProvider(options);

      // Assess
      expect(provider.client.config).toEqual(
        expect.objectContaining({
          serviceId: 'Secrets Manager',
        })
      );
      expect(console.warn).toHaveBeenNthCalledWith(
        1,
        'awsSdkV3Client is not an AWS SDK v3 client, using default client'
      );
      expect(addUserAgentMiddleware).toHaveBeenCalled();
    });
  });

  describe('Method: _get', () => {
    it('gets the secret string when called with only a name', async () => {
      // Prepare
      const provider = new SecretsProvider();
      const secretName = 'foo';
      client.on(GetSecretValueCommand).resolves({
        SecretString: 'bar',
      });

      // Act
      const result = await provider.get(secretName);

      // Assess
      expect(result).toBe('bar');
    });

    it('gets the secret binary when called with only a name', async () => {
      // Prepare
      const provider = new SecretsProvider();
      const secretName = 'foo';
      const mockData = encoder.encode('my-value');
      client.on(GetSecretValueCommand).resolves({
        SecretBinary: mockData,
      });

      // Act
      const result = await provider.get(secretName);

      // Assess
      expect(result).toBe(mockData);
    });

    it('gets the secret using the options provided', async () => {
      // Prepare
      const provider = new SecretsProvider();
      const secretName = 'foo';
      client.on(GetSecretValueCommand).resolves({
        SecretString: 'bar',
      });

      // Act
      await provider.get(secretName, {
        sdkOptions: {
          VersionId: 'test-version',
        },
      });

      // Assess
      expect(client).toReceiveCommandWith(GetSecretValueCommand, {
        SecretId: secretName,
        VersionId: 'test-version',
      });
    });

    it('gets the secret using the sdkOptions overrides provided', async () => {
      // Prepare
      const provider = new SecretsProvider();
      const secretName = 'foo';
      client.on(GetSecretValueCommand).resolves({
        SecretString: 'bar',
      });

      // Act
      await provider.get(secretName, {
        sdkOptions: {
          SecretId: 'test-secret',
        } as unknown as GetSecretValueCommandInput,
      });

      // Assess
      expect(client).toReceiveCommandWith(GetSecretValueCommand, {
        SecretId: secretName,
      });
    });
  });

  describe('Method: _getMultiple', () => {
    it('throws when when called', async () => {
      // Prepare
      const provider = new SecretsProvider();

      // Act & Assess
      await expect(provider.getMultiple('foo')).rejects.toThrow(
        'Method not implemented.'
      );
    });
  });
});

/**
 * Test SecretsProvider class
 *
 * @group unit/parameters/SecretsProvider/class
 */
import { SecretsProvider } from '../../src/secrets';
import {
  SecretsManagerClient,
  GetSecretValueCommand,
} from '@aws-sdk/client-secrets-manager';
import type { GetSecretValueCommandInput } from '@aws-sdk/client-secrets-manager';
import type { SecretsProviderOptions } from '../../src/types/SecretsProvider';
import { mockClient } from 'aws-sdk-client-mock';
import 'aws-sdk-client-mock-jest';

const encoder = new TextEncoder();

describe('Class: SecretsProvider', () => {
  const client = mockClient(SecretsManagerClient);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Method: constructor', () => {
    test('when the class instantiates without SDK client and client config it has default options', async () => {
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
    });

    test('when the user provides a client config in the options, the class instantiates a new client with client config options', async () => {
      // Prepare
      const options: SecretsProviderOptions = {
        clientConfig: {
          serviceId: 'with-client-config',
        },
      };

      // Act
      const provider = new SecretsProvider(options);

      // Assess
      expect(provider.client.config).toEqual(
        expect.objectContaining({
          serviceId: 'with-client-config',
        })
      );
    });

    test('when the user provides an SDK client in the options, the class instantiates with it', async () => {
      // Prepare
      const awsSdkV3Client = new SecretsManagerClient({
        serviceId: 'with-custom-sdk-client',
      });

      const options: SecretsProviderOptions = {
        awsSdkV3Client: awsSdkV3Client,
      };

      // Act
      const provider = new SecretsProvider(options);

      // Assess
      expect(provider.client.config).toEqual(
        expect.objectContaining({
          serviceId: 'with-custom-sdk-client',
        })
      );
    });

    test('when the user provides NOT an SDK client in the options, it throws an error', async () => {
      // Prepare
      const awsSdkV3Client = {};
      const options: SecretsProviderOptions = {
        awsSdkV3Client: awsSdkV3Client as SecretsManagerClient,
      };

      // Act & Assess
      expect(() => {
        new SecretsProvider(options);
      }).toThrow();
    });
  });

  describe('Method: _get', () => {
    test('when called with only a name, it gets the secret string', async () => {
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

    test('when called with only a name, it gets the secret binary', async () => {
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

    test('when called with a name and sdkOptions, it gets the secret using the options provided', async () => {
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

    test('when called with sdkOptions that override arguments passed to the method, it gets the secret using the arguments', async () => {
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
    test('when called, it throws an error', async () => {
      // Prepare
      const provider = new SecretsProvider();

      // Act & Assess
      await expect(provider.getMultiple('foo')).rejects.toThrow(
        'Method not implemented.'
      );
    });
  });
});

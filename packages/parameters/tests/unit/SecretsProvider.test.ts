/**
 * Test SecretsProvider class
 *
 * @group unit/parameters/SecretsProvider/class
 */
import { SecretsProvider } from '../../src/secrets';
import { SecretsManagerClient, GetSecretValueCommand } from '@aws-sdk/client-secrets-manager';
import type { GetSecretValueCommandInput } from '@aws-sdk/client-secrets-manager';
import { mockClient } from 'aws-sdk-client-mock';
import 'aws-sdk-client-mock-jest';

const encoder = new TextEncoder();

describe('Class: SecretsProvider', () => {

  const client = mockClient(SecretsManagerClient);

  beforeEach(() => {
    jest.clearAllMocks();
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
        }
      });

      // Assess
      expect(client).toReceiveCommandWith(GetSecretValueCommand, {
        SecretId: secretName,
        VersionId: 'test-version',
      });

    });

  });

  describe('Method: _getMultiple', () => {
    
    test('when called, it throws an error', async () => {

      // Prepare
      const provider = new SecretsProvider();
      
      // Act & Assess
      await expect(provider.getMultiple('foo')).rejects.toThrow('Method not implemented.');

    });

  });

  describe('Method: removeNonOverridableOptions', () => {

    class DummyProvider extends SecretsProvider {
      public removeNonOverridableOptions(options: GetSecretValueCommandInput): void {
        super.removeNonOverridableOptions(options);
      }
    }

    test('when called with a valid GetSecretValueCommandInput, it removes the non-overridable options', () => {

      // Prepare
      const provider = new DummyProvider();
      const options: GetSecretValueCommandInput = {
        SecretId: 'test-secret',
        VersionId: 'test-version',
      };

      // Act
      provider.removeNonOverridableOptions(options);

      // Assess
      expect(options).toEqual({
        VersionId: 'test-version',
      });

    });

  });

});
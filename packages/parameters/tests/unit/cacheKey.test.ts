import { DynamoDBClient, GetItemCommand } from '@aws-sdk/client-dynamodb';
import {
  GetSecretValueCommand,
  SecretsManagerClient,
} from '@aws-sdk/client-secrets-manager';
import {
  GetParameterCommand,
  GetParametersByPathCommand,
  GetParametersCommand,
  SSMClient,
} from '@aws-sdk/client-ssm';
import { marshall } from '@aws-sdk/util-dynamodb';
import { mockClient } from 'aws-sdk-client-mock';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DynamoDBProvider } from '../../src/dynamodb/index.js';
import { SecretsProvider } from '../../src/secrets/index.js';
import { SSMProvider } from '../../src/ssm/index.js';

vi.mock('@aws-lambda-powertools/commons', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@aws-lambda-powertools/commons')>()),
  addUserAgentMiddleware: vi.fn(),
}));

/**
 * Calls that differ only in options that change the value returned by the
 * store (decryption, recursion, version, consistency) must not share a cache
 * entry. Each mock returns a value derived from the request so that a cache
 * collision surfaces as the wrong value being returned.
 */
describe('Cache key isolation', () => {
  const ssm = mockClient(SSMClient);
  const secrets = mockClient(SecretsManagerClient);
  const dynamodb = mockClient(DynamoDBClient);

  beforeEach(() => {
    ssm.reset();
    secrets.reset();
    dynamodb.reset();
  });

  describe('SSMProvider', () => {
    beforeEach(() => {
      ssm.on(GetParameterCommand).callsFake((input) => ({
        Parameter: {
          Value: input.WithDecryption ? 'plaintext' : 'ciphertext',
        },
      }));
    });

    it('does not serve a decrypted value to a call that did not ask for decryption', async () => {
      // Prepare
      const provider = new SSMProvider();

      // Act
      const decrypted = await provider.get('/secure', { decrypt: true });
      const raw = await provider.get('/secure');

      // Assess
      expect(decrypted).toBe('plaintext');
      expect(raw).toBe('ciphertext');
      expect(ssm.commandCalls(GetParameterCommand)).toHaveLength(2);
    });

    it('does not serve an encrypted value to a call that asked for decryption', async () => {
      // Prepare
      const provider = new SSMProvider();

      // Act
      const raw = await provider.get('/secure');
      const decrypted = await provider.get('/secure', { decrypt: true });

      // Assess
      expect(raw).toBe('ciphertext');
      expect(decrypted).toBe('plaintext');
      expect(ssm.commandCalls(GetParameterCommand)).toHaveLength(2);
    });

    it('does not serve a decrypted value to a call that disabled decryption via sdkOptions', async () => {
      // Prepare
      const provider = new SSMProvider();

      // Act
      const decrypted = await provider.get('/secure', { decrypt: true });
      const raw = await provider.get('/secure', {
        sdkOptions: { WithDecryption: false },
      });

      // Assess
      expect(decrypted).toBe('plaintext');
      expect(raw).toBe('ciphertext');
      expect(ssm.commandCalls(GetParameterCommand)).toHaveLength(2);
    });

    it('does not serve a recursive result to a non-recursive getMultiple call', async () => {
      // Prepare
      ssm.on(GetParametersByPathCommand).callsFake((input) => ({
        Parameters: input.Recursive
          ? [
              { Name: '/app/a', Value: 'a' },
              { Name: '/app/nested/b', Value: 'b' },
            ]
          : [{ Name: '/app/a', Value: 'a' }],
      }));
      const provider = new SSMProvider();

      // Act
      const recursive = await provider.getMultiple('/app', {
        recursive: true,
      });
      const shallow = await provider.getMultiple('/app');

      // Assess
      expect(recursive).toEqual({ a: 'a', 'nested/b': 'b' });
      expect(shallow).toEqual({ a: 'a' });
      expect(ssm.commandCalls(GetParametersByPathCommand)).toHaveLength(2);
    });

    it('does not serve a decrypted result to a non-decrypting getMultiple call', async () => {
      // Prepare
      ssm.on(GetParametersByPathCommand).callsFake((input) => ({
        Parameters: [
          {
            Name: '/app/a',
            Value: input.WithDecryption ? 'plaintext' : 'ciphertext',
          },
        ],
      }));
      const provider = new SSMProvider();

      // Act
      const decrypted = await provider.getMultiple('/app', { decrypt: true });
      const raw = await provider.getMultiple('/app');

      // Assess
      expect(decrypted).toEqual({ a: 'plaintext' });
      expect(raw).toEqual({ a: 'ciphertext' });
      expect(ssm.commandCalls(GetParametersByPathCommand)).toHaveLength(2);
    });

    it('does not serve decrypted values to a getParametersByName call that did not ask for decryption', async () => {
      // Prepare
      ssm.on(GetParametersCommand).callsFake((input) => ({
        Parameters: input.Names.map((name: string) => ({
          Name: name,
          Value: input.WithDecryption ? 'plaintext' : 'ciphertext',
        })),
        InvalidParameters: [],
      }));
      const provider = new SSMProvider();

      // Act
      const decrypted = await provider.getParametersByName(
        { '/a': {}, '/b': {} },
        { decrypt: true }
      );
      const raw = await provider.getParametersByName({ '/a': {}, '/b': {} });

      // Assess
      expect(decrypted).toEqual({ '/a': 'plaintext', '/b': 'plaintext' });
      expect(raw).toEqual({ '/a': 'ciphertext', '/b': 'ciphertext' });
      expect(ssm.commandCalls(GetParametersCommand)).toHaveLength(2);
    });

    it('does not share a cache entry between get and getMultiple for the same name', async () => {
      // Prepare
      ssm.on(GetParameterCommand).resolves({
        Parameter: { Value: 'single' },
      });
      ssm.on(GetParametersByPathCommand).resolves({
        Parameters: [{ Name: '/app/a', Value: 'a' }],
      });
      const provider = new SSMProvider();

      // Act
      const single = await provider.get('/app');
      const multiple = await provider.getMultiple('/app');

      // Assess
      expect(single).toBe('single');
      expect(multiple).toEqual({ a: 'a' });
      expect(ssm.commandCalls(GetParametersByPathCommand)).toHaveLength(1);
    });

    it('does not cache getParametersByName results for a parameter with maxAge of 0', async () => {
      // Prepare
      ssm.on(GetParametersCommand).callsFake((input) => ({
        Parameters: input.Names.map((name: string) => ({
          Name: name,
          Value: 'value',
        })),
        InvalidParameters: [],
      }));
      const provider = new SSMProvider();

      // Act
      await provider.getParametersByName({ '/a': { maxAge: 0 } });
      await provider.getParametersByName({ '/a': {} });

      // Assess
      expect(ssm.commandCalls(GetParametersCommand)).toHaveLength(2);
    });

    it('does not serve a cached value to a call with maxAge of 0', async () => {
      // Prepare
      const provider = new SSMProvider();

      // Act
      await provider.get('/secure');
      await provider.get('/secure', { maxAge: 0 });

      // Assess
      expect(ssm.commandCalls(GetParameterCommand)).toHaveLength(2);
    });
  });

  describe('SecretsProvider', () => {
    beforeEach(() => {
      secrets.on(GetSecretValueCommand).callsFake((input) => ({
        SecretString: `secret@${input.VersionStage ?? input.VersionId ?? 'AWSCURRENT'}`,
      }));
    });

    it('does not serve a specific version stage to a call for the current version', async () => {
      // Prepare
      const provider = new SecretsProvider();

      // Act
      const previous = await provider.get('db', {
        sdkOptions: { VersionStage: 'AWSPREVIOUS' },
      });
      const current = await provider.get('db');

      // Assess
      expect(previous).toBe('secret@AWSPREVIOUS');
      expect(current).toBe('secret@AWSCURRENT');
      expect(secrets.commandCalls(GetSecretValueCommand)).toHaveLength(2);
    });

    it('does not share a cache entry between different version ids', async () => {
      // Prepare
      const provider = new SecretsProvider();

      // Act
      const v1 = await provider.get('db', { sdkOptions: { VersionId: 'v1' } });
      const v2 = await provider.get('db', { sdkOptions: { VersionId: 'v2' } });

      // Assess
      expect(v1).toBe('secret@v1');
      expect(v2).toBe('secret@v2');
      expect(secrets.commandCalls(GetSecretValueCommand)).toHaveLength(2);
    });
  });

  describe('DynamoDBProvider', () => {
    beforeEach(() => {
      dynamodb.on(GetItemCommand).callsFake((input) => ({
        Item: marshall({
          id: 'foo',
          value: input.ConsistentRead ? 'consistent' : 'eventual',
        }),
      }));
    });

    it('does not share a cache entry between calls with different sdkOptions', async () => {
      // Prepare
      const provider = new DynamoDBProvider({ tableName: 'test-table' });

      // Act
      const consistent = await provider.get('foo', {
        sdkOptions: { ConsistentRead: true },
      });
      const eventual = await provider.get('foo');

      // Assess
      expect(consistent).toBe('consistent');
      expect(eventual).toBe('eventual');
      expect(dynamodb.commandCalls(GetItemCommand)).toHaveLength(2);
    });
  });
});

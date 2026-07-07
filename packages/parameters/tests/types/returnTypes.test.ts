import type { JSONValue } from '@aws-lambda-powertools/commons/types';
import {
  AppConfigDataClient,
  GetLatestConfigurationCommand,
  StartConfigurationSessionCommand,
} from '@aws-sdk/client-appconfigdata';
import {
  GetSecretValueCommand,
  SecretsManagerClient,
} from '@aws-sdk/client-secrets-manager';
import {
  GetParameterCommand,
  GetParametersByPathCommand,
  SSMClient,
} from '@aws-sdk/client-ssm';
import { toBase64 } from '@smithy/util-base64';
import { Uint8ArrayBlobAdapter } from '@smithy/util-stream';
import { mockClient } from 'aws-sdk-client-mock';
import { beforeEach, describe, expectTypeOf, it, vi } from 'vitest';
import { getAppConfig } from '../../src/appconfig/index.js';
import { getConfig } from '../../src/appconfig-agent/index.js';
import { Transform } from '../../src/index.js';
import { getSecret } from '../../src/secrets/index.js';
import { getParameter, getParameters } from '../../src/ssm/index.js';

describe('Return types', () => {
  const appConfigclient = mockClient(AppConfigDataClient);
  const ssmClient = mockClient(SSMClient);
  const secretsClient = mockClient(SecretsManagerClient);
  const encoder = new TextEncoder();
  const stubFetchForAppConfigAgent = (body: string) => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        text: vi.fn().mockResolvedValue(body),
      })
    );
  };

  beforeEach(() => {
    appConfigclient.reset();
    ssmClient.reset();
    vi.unstubAllGlobals();
  });

  it('returns a string value when called with transform: `binary` option', async () => {
    // Prepare
    const expectedValue = 'my-value';
    const mockData = Uint8ArrayBlobAdapter.fromString(
      toBase64(encoder.encode(expectedValue))
    );
    appConfigclient
      .on(StartConfigurationSessionCommand)
      .resolves({
        InitialConfigurationToken: 'abcdefg',
      })
      .on(GetLatestConfigurationCommand)
      .resolves({
        Configuration: mockData,
        NextPollConfigurationToken: 'hijklmn',
      });

    // Act
    const result: string | undefined = await getAppConfig('my-config', {
      application: 'my-app',
      environment: 'prod',
      transform: Transform.BINARY,
    });

    // Assess
    expectTypeOf(result).toMatchTypeOf<string | undefined>();
  });

  it('returns a JSON value when using the transform `json` option', async () => {
    // Prepare
    const expectedValue = { foo: 'my-value' };
    const mockData = Uint8ArrayBlobAdapter.fromString(
      JSON.stringify(expectedValue)
    );
    appConfigclient
      .on(StartConfigurationSessionCommand)
      .resolves({
        InitialConfigurationToken: 'abcdefg',
      })
      .on(GetLatestConfigurationCommand)
      .resolves({
        Configuration: mockData,
        NextPollConfigurationToken: 'hijklmn',
      });

    // Act
    const result: JSONValue = await getAppConfig('my-config', {
      application: 'my-app',
      environment: 'prod',
      transform: Transform.JSON,
    });

    // Assess
    expectTypeOf(result).toMatchTypeOf<JSONValue>();
  });

  it('sets the correct type when called and transform `JSON` is specified', async () => {
    // Prepare
    const parameterName = 'foo';
    const parameterValue = JSON.stringify({ hello: 'world' });
    ssmClient.on(GetParameterCommand).resolves({
      Parameter: {
        Value: parameterValue,
      },
    });

    // Act
    const value: JSONValue | undefined = await getParameter(parameterName, {
      transform: 'json',
    });

    // Assess
    expectTypeOf(value).toMatchTypeOf<JSONValue | undefined>();
  });

  it('casts the provided generic type when called and transform `JSON`', async () => {
    // Prepare
    const parameterName = 'foo';
    const parameterValue = JSON.stringify(5);
    ssmClient.on(GetParameterCommand).resolves({
      Parameter: {
        Value: parameterValue,
      },
    });

    // Act
    const value: number | undefined = await getParameter<number>(
      parameterName,
      { transform: 'json' }
    );

    // Assess
    expectTypeOf(value).toMatchTypeOf<number | undefined>();
  });

  it('sets the correct type when called and transform `JSON` is specified', async () => {
    // Prepare
    const parameterPath = '/foo';
    const parameterValue = JSON.stringify({ hello: 'world' });
    ssmClient.on(GetParametersByPathCommand).resolves({
      Parameters: [
        {
          Name: '/foo/bar',
          Value: parameterValue,
        },
      ],
    });

    // Act
    const parameters: Record<string, Record<string, unknown>> | undefined =
      await getParameters(parameterPath);

    // Assess
    expectTypeOf(parameters).toMatchTypeOf<
      Record<string, Record<string, unknown>> | undefined
    >();
  });

  it('casts the provided generic type when called and transform `JSON`', async () => {
    // Prepare
    const parameterPath = '/foo';
    const parameterValue = JSON.stringify(5);
    ssmClient.on(GetParametersByPathCommand).resolves({
      Parameters: [
        {
          Name: '/foo/bar',
          Value: parameterValue,
        },
      ],
    });

    // Act
    const parameters: Record<string, Record<string, number>> | undefined =
      await getParameters<Record<string, number>>(parameterPath);

    // Assess
    expectTypeOf(parameters).toMatchTypeOf<
      Record<string, Record<string, number>> | undefined
    >();
  });

  it('sets the correct type when called and transform `JSON` is specified', async () => {
    // Prepare
    const secretName = 'foo';
    const secretValue = JSON.stringify({ hello: 'world' });
    secretsClient.on(GetSecretValueCommand).resolves({
      SecretString: secretValue,
    });

    // Act
    const value: JSONValue | undefined = await getSecret(secretName, {
      transform: 'json',
    });

    // Assess
    expectTypeOf(value).toMatchTypeOf<JSONValue | undefined>();
  });

  it('casts the provided generic type when called and transform `JSON`', async () => {
    // Prepare
    const secretName = 'foo';
    const secretValue = JSON.stringify(5);
    secretsClient.on(GetSecretValueCommand).resolves({
      SecretString: secretValue,
    });

    // Act
    const value: number | undefined = await getSecret<number>(secretName, {
      transform: 'json',
    });

    // Assess
    expectTypeOf(value).toMatchTypeOf<number | undefined>();
  });

  it('narrows the type to exclude undefined when throwOnMissing is set on getParameter', async () => {
    // Prepare
    const parameterName = 'foo';
    ssmClient.on(GetParameterCommand).resolves({
      Parameter: {
        Value: 'my-value',
      },
    });

    // Act
    const value = await getParameter(parameterName, { throwOnMissing: true });

    // Assess
    expectTypeOf(value).toEqualTypeOf<string>();
  });

  it('keeps undefined in the type when throwOnMissing is false on getParameter', async () => {
    // Prepare
    const parameterName = 'foo';
    ssmClient.on(GetParameterCommand).resolves({
      Parameter: {
        Value: 'my-value',
      },
    });

    // Act
    const value = await getParameter(parameterName, { throwOnMissing: false });

    // Assess
    expectTypeOf(value).toEqualTypeOf<string | undefined>();
  });

  it('narrows the type alongside a transform when throwOnMissing is set on getParameter', async () => {
    // Prepare
    const parameterName = 'foo';
    ssmClient.on(GetParameterCommand).resolves({
      Parameter: {
        Value: JSON.stringify({ hello: 'world' }),
      },
    });

    // Act
    const value = await getParameter(parameterName, {
      transform: 'json',
      throwOnMissing: true,
    });

    // Assess
    expectTypeOf(value).toEqualTypeOf<JSONValue>();
  });

  it('narrows the type to exclude undefined when throwOnMissing is set on getSecret', async () => {
    // Prepare
    const secretName = 'foo';
    secretsClient.on(GetSecretValueCommand).resolves({
      SecretString: 'my-value',
    });

    // Act
    const value = await getSecret(secretName, { throwOnMissing: true });

    // Assess
    expectTypeOf(value).toEqualTypeOf<string | Uint8Array>();
  });

  it('narrows the type to exclude undefined when throwOnMissing is set on getAppConfig', async () => {
    // Prepare
    appConfigclient
      .on(StartConfigurationSessionCommand)
      .resolves({
        InitialConfigurationToken: 'abcdefg',
      })
      .on(GetLatestConfigurationCommand)
      .resolves({
        Configuration: Uint8ArrayBlobAdapter.fromString('my-value'),
        NextPollConfigurationToken: 'hijklmn',
      });

    // Act
    const value = await getAppConfig('my-config', {
      application: 'my-app',
      environment: 'prod',
      throwOnMissing: true,
    });

    // Assess
    expectTypeOf(value).toEqualTypeOf<Uint8Array>();
  });

  it('returns a string value when getConfig is called without a transform', async () => {
    // Prepare
    stubFetchForAppConfigAgent('my-value');

    // Act
    const value = await getConfig('my-config', {
      application: 'my-app',
      environment: 'prod',
    });

    // Assess
    expectTypeOf(value).toEqualTypeOf<string | undefined>();
  });

  it('returns a JSON value when getConfig is called with transform `json`', async () => {
    // Prepare
    stubFetchForAppConfigAgent('{"key":"value"}');

    // Act
    const value = await getConfig('my-config', {
      application: 'my-app',
      environment: 'prod',
      transform: 'json',
    });

    // Assess
    expectTypeOf(value).toEqualTypeOf<JSONValue | undefined>();
  });

  it('returns a string value when getConfig is called with transform `binary`', async () => {
    // Prepare
    stubFetchForAppConfigAgent(toBase64(encoder.encode('my-value')));

    // Act
    const value = await getConfig('my-config', {
      application: 'my-app',
      environment: 'prod',
      transform: 'binary',
    });

    // Assess
    expectTypeOf(value).toEqualTypeOf<string | undefined>();
  });

  it('casts the provided generic type when getConfig is called with a type parameter', async () => {
    // Prepare
    stubFetchForAppConfigAgent('{"key":"value"}');

    // Act
    const value = await getConfig<{ key: string }>('my-config', {
      application: 'my-app',
      environment: 'prod',
      transform: 'json',
    });

    // Assess
    expectTypeOf(value).toEqualTypeOf<{ key: string } | undefined>();
  });
});

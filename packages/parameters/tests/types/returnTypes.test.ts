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
import { Transform } from '../../src/index.js';
import { getSecret } from '../../src/secrets/index.js';
import { getParameter, getParameters } from '../../src/ssm/index.js';

describe('Return types', () => {
  const appConfigclient = mockClient(AppConfigDataClient);
  const ssmClient = mockClient(SSMClient);
  const secretsClient = mockClient(SecretsManagerClient);
  const encoder = new TextEncoder();

  beforeEach(() => {
    appConfigclient.reset();
    ssmClient.reset();
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
    const value: Record<string, unknown> | undefined = await getParameter(
      parameterName,
      { transform: 'json' }
    );

    // Assess
    expectTypeOf(value).toMatchTypeOf<Record<string, unknown> | undefined>();
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
    const value: Record<string, unknown> | undefined = await getSecret(
      secretName,
      { transform: 'json' }
    );

    // Assess
    expectTypeOf(value).toMatchTypeOf<Record<string, unknown> | undefined>();
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
});

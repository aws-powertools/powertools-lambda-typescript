/**
 * Test getAppConfig function
 *
 * @group unit/parameters/AppConfigProvider/getAppConfig/function
 */
import { AppConfigProvider, getAppConfig } from '../../src/appconfig/index.js';
import { DEFAULT_PROVIDERS } from '../../src/base/DefaultProviders.js';
import { Transform } from '../../src/index.js';
import {
  AppConfigDataClient,
  StartConfigurationSessionCommand,
  GetLatestConfigurationCommand,
} from '@aws-sdk/client-appconfigdata';
import { mockClient } from 'aws-sdk-client-mock';
import 'aws-sdk-client-mock-jest';
import { toBase64 } from '@smithy/util-base64';
import { Uint8ArrayBlobAdapter } from '@smithy/util-stream';
import type { JSONValue } from '@aws-lambda-powertools/commons/types';

describe('Function: getAppConfig', () => {
  const client = mockClient(AppConfigDataClient);
  const encoder = new TextEncoder();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('when called and a default provider does not exist, it instantiates one and returns the value', async () => {
    // Prepare
    const mockData = Uint8ArrayBlobAdapter.fromString('myAppConfiguration');
    client
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
    const result: Uint8Array | undefined = await getAppConfig('my-config', {
      application: 'my-app',
      environment: 'prod',
    });

    // Assess
    expect(result).toBe(mockData);
  });

  test('when called and a default provider exists, it uses it and returns the value', async () => {
    // Prepare
    const provider = new AppConfigProvider({
      application: 'my-app',
      environment: 'prod',
    });
    DEFAULT_PROVIDERS.appconfig = provider;
    const mockData = Uint8ArrayBlobAdapter.fromString('myAppConfiguration');
    client
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
    const result: Uint8Array | undefined = await getAppConfig('my-config', {
      application: 'my-app',
      environment: 'prod',
    });

    // Assess
    expect(result).toBe(mockData);
  });

  test('when called with transform: `binary` option, it returns string value', async () => {
    // Prepare
    const expectedValue = 'my-value';
    const mockData = Uint8ArrayBlobAdapter.fromString(
      toBase64(encoder.encode(expectedValue))
    );
    client
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
    expect(result).toBe(expectedValue);
  });

  test('when called with transform: `json` option, it returns a JSON value', async () => {
    // Prepare
    const expectedValue = { foo: 'my-value' };
    const mockData = Uint8ArrayBlobAdapter.fromString(
      JSON.stringify(expectedValue)
    );
    client
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
    expect(result).toStrictEqual(expectedValue);
  });
});

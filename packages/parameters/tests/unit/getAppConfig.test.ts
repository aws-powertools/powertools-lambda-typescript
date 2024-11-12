import {
  AppConfigDataClient,
  GetLatestConfigurationCommand,
  StartConfigurationSessionCommand,
} from '@aws-sdk/client-appconfigdata';
import { Uint8ArrayBlobAdapter } from '@smithy/util-stream';
import { mockClient } from 'aws-sdk-client-mock';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AppConfigProvider, getAppConfig } from '../../src/appconfig/index.js';
import { DEFAULT_PROVIDERS } from '../../src/base/DefaultProviders.js';

describe('Function: getAppConfig', () => {
  const client = mockClient(AppConfigDataClient);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('instantiates a new client and returns the value when no default provider exists', async () => {
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
    const result = await getAppConfig('my-config', {
      application: 'my-app',
      environment: 'prod',
    });

    // Assess
    expect(result).toBe(mockData);
  });

  it('uses the cached provider when one is present in the cache', async () => {
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
    const result = await getAppConfig('my-config', {
      application: 'my-app',
      environment: 'prod',
    });

    // Assess
    expect(result).toBe(mockData);
  });
});

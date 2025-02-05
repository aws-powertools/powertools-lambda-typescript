import { addUserAgentMiddleware } from '@aws-lambda-powertools/commons';
import {
  AppConfigDataClient,
  GetLatestConfigurationCommand,
  StartConfigurationSessionCommand,
} from '@aws-sdk/client-appconfigdata';
import { Uint8ArrayBlobAdapter } from '@smithy/util-stream';
import { mockClient } from 'aws-sdk-client-mock';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AppConfigProvider } from '../../src/appconfig/index.js';
import { ExpirableValue } from '../../src/base/ExpirableValue.js';
import { APPCONFIG_TOKEN_EXPIRATION } from '../../src/constants';
import type { AppConfigProviderOptions } from '../../src/types/AppConfigProvider.js';

vi.mock('@aws-lambda-powertools/commons', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@aws-lambda-powertools/commons')>()),
  addUserAgentMiddleware: vi.fn(),
}));
vi.useFakeTimers();

describe('Class: AppConfigProvider', () => {
  const client = mockClient(AppConfigDataClient);

  beforeEach(() => {
    vi.clearAllMocks();
    client.reset();
  });

  describe('Method: constructor', () => {
    it('instantiates a new AWS SDK and adds a middleware to it', async () => {
      // Prepare
      const options: AppConfigProviderOptions = {
        application: 'MyApp',
        environment: 'MyAppProdEnv',
      };

      // Act
      const provider = new AppConfigProvider(options);

      // Assess
      expect(provider.client.config).toEqual(
        expect.objectContaining({
          serviceId: 'AppConfigData',
        })
      );
      expect(addUserAgentMiddleware).toHaveBeenCalled();
    });

    it('instantiates a new AWS SDK client using the provided config', async () => {
      // Prepare
      const options: AppConfigProviderOptions = {
        application: 'MyApp',
        environment: 'MyAppProdEnv',
        clientConfig: {
          region: 'eu-south-2',
        },
      };

      // Act
      const provider = new AppConfigProvider(options);

      // Assess
      await expect(provider.client.config.region()).resolves.toEqual(
        'eu-south-2'
      );
      expect(addUserAgentMiddleware).toHaveBeenCalled();
    });

    it('uses the provided AWS SDK client', async () => {
      // Prepare
      const awsSdkV3Client = new AppConfigDataClient({
        endpoint: 'http://localhost:8000',
        serviceId: 'Foo',
      });

      const options: AppConfigProviderOptions = {
        application: 'MyApp',
        environment: 'MyAppProdEnv',
        awsSdkV3Client: awsSdkV3Client,
      };

      // Act
      const provider = new AppConfigProvider(options);

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
      const options: AppConfigProviderOptions = {
        application: 'MyApp',
        environment: 'MyAppProdEnv',
        awsSdkV3Client: awsSdkV3Client as AppConfigDataClient,
      };

      // Act
      const provider = new AppConfigProvider(options);

      // Assess
      expect(provider.client.config).toEqual(
        expect.objectContaining({
          serviceId: 'AppConfigData',
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
    it('returns the binary configuration as-is', async () => {
      // Prepare
      const options: AppConfigProviderOptions = {
        application: 'MyApp',
        environment: 'MyAppProdEnv',
      };
      const provider = new AppConfigProvider(options);
      const name = 'MyAppFeatureFlag';

      const fakeInitialToken = 'aW5pdGlhbFRva2Vu';
      const fakeNextToken = 'bmV4dFRva2Vu';
      const mockData = Uint8ArrayBlobAdapter.fromString('myAppConfiguration');

      client
        .on(StartConfigurationSessionCommand)
        .resolves({
          InitialConfigurationToken: fakeInitialToken,
        })
        .on(GetLatestConfigurationCommand)
        .resolves({
          Configuration: mockData,
          NextPollConfigurationToken: fakeNextToken,
        });

      // Act
      const result = await provider.get(name);

      // Assess
      expect(result).toBe(mockData);
    });

    it('uses the application name from the POWERTOOLS_SERVICE_NAME env variable', async () => {
      // Prepare
      process.env.POWERTOOLS_SERVICE_NAME = 'MyApp';
      const config = {
        environment: 'MyAppProdEnv',
      };
      const provider = new AppConfigProvider(config);
      const name = 'MyAppFeatureFlag';

      const fakeInitialToken = 'aW5pdGlhbFRva2Vu';
      const fakeNextToken = 'bmV4dFRva2Vu';
      const mockData = Uint8ArrayBlobAdapter.fromString('myAppConfiguration');

      client
        .on(StartConfigurationSessionCommand)
        .resolves({
          InitialConfigurationToken: fakeInitialToken,
        })
        .on(GetLatestConfigurationCommand)
        .resolves({
          Configuration: mockData,
          NextPollConfigurationToken: fakeNextToken,
        });

      // Act
      const result = await provider.get(name);

      // Assess
      expect(result).toBe(mockData);
    });

    it('throws when no application is set', async () => {
      // Prepare
      process.env.POWERTOOLS_SERVICE_NAME = '';
      const options = {
        environment: 'MyAppProdEnv',
      };

      // Act & Assess
      expect(() => {
        new AppConfigProvider(options);
      }).toThrow();
    });

    it('invalidates the cached token when the response does not have a next token present, thus forcing a new session', async () => {
      // Prepare
      class AppConfigProviderMock extends AppConfigProvider {
        public _addToStore(key: string, value: string): void {
          this.configurationTokenStore.set(key, {
            value,
            expiration: Date.now() + APPCONFIG_TOKEN_EXPIRATION,
          });
        }

        public _storeHas(key: string): boolean {
          return this.configurationTokenStore.has(key);
        }
      }

      const options: AppConfigProviderOptions = {
        application: 'MyApp',
        environment: 'MyAppProdEnv',
      };
      const provider = new AppConfigProviderMock(options);
      const name = 'MyAppFeatureFlag';
      const fakeToken = 'ZmFrZVRva2Vu';
      const mockData = Uint8ArrayBlobAdapter.fromString('myAppConfiguration');

      client.on(GetLatestConfigurationCommand).resolves({
        Configuration: mockData,
        NextPollConfigurationToken: undefined,
      });

      // Act
      provider._addToStore(name, fakeToken);
      await provider.get(name);

      // Assess
      expect(provider._storeHas(name)).toBe(false);
    });

    it('throws when the session response does not include an initial token', async () => {
      // Prepare
      const options: AppConfigProviderOptions = {
        application: 'MyApp',
        environment: 'MyAppProdEnv',
      };
      const provider = new AppConfigProvider(options);
      const name = 'MyAppFeatureFlag';

      client.on(StartConfigurationSessionCommand).resolves({
        InitialConfigurationToken: undefined,
      });

      // Act & Assess
      await expect(provider.get(name)).rejects.toThrow();
    });

    it('returns the last value when the session returns an empty configuration on the second call', async () => {
      // Prepare
      const options: AppConfigProviderOptions = {
        application: 'MyApp',
        environment: 'MyAppProdEnv',
      };
      const provider = new AppConfigProvider(options);
      const name = 'MyAppFeatureFlag';

      const fakeInitialToken = 'aW5pdGlhbFRva2Vu';
      const fakeNextToken1 = 'bmV4dFRva2Vu';
      const fakeNextToken2 = 'bmV4dFRva2Vq';
      const mockData = Uint8ArrayBlobAdapter.fromString('myAppConfiguration');

      client
        .on(StartConfigurationSessionCommand)
        .resolves({
          InitialConfigurationToken: fakeInitialToken,
        })
        .on(GetLatestConfigurationCommand)
        .resolvesOnce({
          Configuration: mockData,
          NextPollConfigurationToken: fakeNextToken1,
        })
        .resolvesOnce({
          Configuration: undefined,
          NextPollConfigurationToken: fakeNextToken2,
        });

      // Act

      // Load local cache
      const result1 = await provider.get(name, { forceFetch: true });

      // Read from local cache, given empty response from service
      const result2 = await provider.get(name, { forceFetch: true });

      // Assess
      expect(result1).toBe(mockData);
      expect(result2).toBe(mockData);
    });

    it('starts a new session and fetches the token when the session token has expired', async () => {
      // Prepare
      const options: AppConfigProviderOptions = {
        application: 'MyApp',
        environment: 'MyAppProdEnv',
      };
      const provider = new AppConfigProvider(options);
      const name = 'MyAppFeatureFlag';

      const fakeInitialToken = 'aW5pdGlhbFRva2Vu';
      const fakeSecondToken = 'bZ6pdGlhbFRva3Wk';
      const fakeNextToken1 = 'bmV4dFRva2Vu';
      const mockData = Uint8ArrayBlobAdapter.fromString('foo');
      const mockData2 = Uint8ArrayBlobAdapter.fromString('bar');

      client
        .on(StartConfigurationSessionCommand)
        .resolvesOnce({
          InitialConfigurationToken: fakeInitialToken,
        })
        .resolvesOnce({
          InitialConfigurationToken: fakeSecondToken,
        })
        .on(GetLatestConfigurationCommand, {
          ConfigurationToken: fakeInitialToken,
        })
        .resolves({
          Configuration: mockData,
          NextPollConfigurationToken: fakeNextToken1,
        })
        .on(GetLatestConfigurationCommand, {
          ConfigurationToken: fakeSecondToken,
        })
        .resolves({
          Configuration: mockData2,
          NextPollConfigurationToken: fakeNextToken1,
        });
      vi.setSystemTime(new Date('2022-03-10'));

      // Act
      const result1 = await provider.get(name, { forceFetch: true });
      // Mock time skip of 24hrs
      vi.setSystemTime(new Date('2022-03-11'));
      const result2 = await provider.get(name, { forceFetch: true });

      // Assess
      expect(result1).toBe(mockData);
      expect(result2).toBe(mockData2);
    });
  });

  describe('Method: _getMultiple', () => {
    it('throws when called because of the method being unsopported', async () => {
      // Prepare
      const config = {
        application: 'MyApp',
        environment: 'MyAppProdEnv',
      };
      const path = '/my/path';
      const provider = new AppConfigProvider(config);
      const errorMessage = 'Method not implemented.';

      // Act & Assess
      await expect(provider.getMultiple(path)).rejects.toThrow(errorMessage);
    });
  });
});

describe('Class: ExpirableValue', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Method: constructor', () => {
    it('has TTL set to at least maxAge seconds from test start', () => {
      // Prepare
      const seconds = 10;
      const nowTimestamp = Date.now();
      const futureTimestampSeconds = nowTimestamp / 1000 + seconds;

      // Act
      const expirableValue = new ExpirableValue('foo', seconds);

      // Assess
      expect(expirableValue.ttl).toBeGreaterThan(futureTimestampSeconds);
    });
  });

  describe('Method: isExpired', () => {
    it('returns true when maxAge is in the future', () => {
      // Prepare
      const seconds = 60;

      // Act
      const expirableValue = new ExpirableValue('foo', seconds);

      // Assess
      expect(expirableValue.isExpired()).toBeFalsy();
    });

    it('returns false when maxAge is in the past', () => {
      // Prepare
      const seconds = -60;

      // Act
      const expirableValue = new ExpirableValue('foo', seconds);

      // Assess
      expect(expirableValue.isExpired()).toBeTruthy();
    });
  });
});

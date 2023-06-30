/**
 * Test AppConfigProvider class
 *
 * @group unit/parameters/AppConfigProvider/class
 */
import { AppConfigProvider } from '../../src/appconfig/index';
import { ExpirableValue } from '../../src/base/ExpirableValue';
import { AppConfigProviderOptions } from '../../src/types/AppConfigProvider';
import {
  AppConfigDataClient,
  StartConfigurationSessionCommand,
  GetLatestConfigurationCommand,
} from '@aws-sdk/client-appconfigdata';
import { Uint8ArrayBlobAdapter } from '@aws-sdk/util-stream';
import { mockClient } from 'aws-sdk-client-mock';
import 'aws-sdk-client-mock-jest';

describe('Class: AppConfigProvider', () => {
  const client = mockClient(AppConfigDataClient);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    client.reset();
  });

  describe('Method: constructor', () => {
    test('when the class instantiates without SDK client and client config it has default options', async () => {
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
    });

    test('when the user provides a client config in the options, the class instantiates a new client with client config options', async () => {
      // Prepare
      const options: AppConfigProviderOptions = {
        application: 'MyApp',
        environment: 'MyAppProdEnv',
        clientConfig: {
          serviceId: 'with-client-config',
        },
      };

      // Act
      const provider = new AppConfigProvider(options);

      // Assess
      expect(provider.client.config).toEqual(
        expect.objectContaining({
          serviceId: 'with-client-config',
        })
      );
    });

    test('when the user provides an SDK client in the options, the class instantiates with it', async () => {
      // Prepare
      const awsSdkV3Client = new AppConfigDataClient({
        serviceId: 'with-custom-sdk-client',
      });

      const options: AppConfigProviderOptions = {
        application: 'MyApp',
        environment: 'MyAppProdEnv',
        awsSdkV3Client: awsSdkV3Client,
      };

      // Act
      const provider = new AppConfigProvider(options);

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
      const options: AppConfigProviderOptions = {
        application: 'MyApp',
        environment: 'MyAppProdEnv',
        awsSdkV3Client: awsSdkV3Client as AppConfigDataClient,
      };

      // Act & Assess
      expect(() => {
        new AppConfigProvider(options);
      }).toThrow();
    });
  });

  describe('Method: _get', () => {
    test('when called with name and options, it returns binary configuration', async () => {
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

    test('when called without application option, it will be retrieved from POWERTOOLS_SERVICE_NAME and provider successfully return configuration', async () => {
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

    test('when called without application option and POWERTOOLS_SERVICE_NAME is not set, it throws an Error', async () => {
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

    test('when configuration response does not have the next token it should force a new session by removing the stored token', async () => {
      // Prepare
      class AppConfigProviderMock extends AppConfigProvider {
        public _addToStore(key: string, value: string): void {
          this.configurationTokenStore.set(key, value);
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

    test('when session response does not have an initial token, it throws an error', async () => {
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

    test('when session returns an empty configuration on the second call, it returns the last value', async () => {
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
  });

  describe('Method: _getMultiple', () => {
    test('when called it throws an Error, because this method is not supported by AppConfig API', async () => {
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
    jest.clearAllMocks();
  });

  describe('Method: constructor', () => {
    test('when created, it has ttl set to at least maxAge seconds from test start', () => {
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
    test('when called, it returns true when maxAge is in the future', () => {
      // Prepare
      const seconds = 60;

      // Act
      const expirableValue = new ExpirableValue('foo', seconds);

      // Assess
      expect(expirableValue.isExpired()).toBeFalsy();
    });

    test('when called, it returns false when maxAge is in the past', () => {
      // Prepare
      const seconds = -60;

      // Act
      const expirableValue = new ExpirableValue('foo', seconds);

      // Assess
      expect(expirableValue.isExpired()).toBeTruthy();
    });
  });
});

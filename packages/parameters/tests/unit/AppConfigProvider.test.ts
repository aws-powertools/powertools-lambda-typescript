/**
 * Test AppConfigProvider class
 *
 * @group unit/parameters/AppConfigProvider/class
 */
import { AppConfigProvider } from '../../src/appconfig/index';

import {
  AppConfigDataClient,
  StartConfigurationSessionCommand,
  GetLatestConfigurationCommand,
} from '@aws-sdk/client-appconfigdata';
import { mockClient } from 'aws-sdk-client-mock';
import 'aws-sdk-client-mock-jest';
import { AppConfigProviderOptions } from '../../src/types/AppConfigProvider';

describe('Class: AppConfigProvider', () => {
  const client = mockClient(AppConfigDataClient);
  const encoder = new TextEncoder();

  beforeEach(() => {
    jest.clearAllMocks();
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
      const mockData = encoder.encode('myAppConfiguration');

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
      const mockData = encoder.encode('myAppConfiguration');

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

    test('when configuration response doesn\'t have the next token it should force a new session by removing the stored token', async () => {
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
      const mockData = encoder.encode('myAppConfiguration');

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

    test('when session response doesn\'t have an initial token, it throws an error', async () => {
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
      const errorMessage = 'Not Implemented';

      // Act & Assess
      await expect(provider.getMultiple(path)).rejects.toThrow(errorMessage);
    });
  });
});

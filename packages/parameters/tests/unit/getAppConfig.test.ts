/**
 * Test getAppConfig function
 *
 * @group unit/parameters/AppConfigProvider/getAppConfig/function
 */
import {
  AppConfigProvider,
  getAppConfig,
  DEFAULT_PROVIDERS,
} from '../../src/appconfig';
import {
  AppConfigDataClient,
  StartConfigurationSessionCommand,
  GetLatestConfigurationCommand,
} from '@aws-sdk/client-appconfigdata';
import { mockClient } from 'aws-sdk-client-mock';
import 'aws-sdk-client-mock-jest';
import type { GetAppConfigCombinedInterface } from '../../src/types/AppConfigProvider';
import { toBase64 } from '@aws-sdk/util-base64-node';

describe('Function: getAppConfig', () => {
  const client = mockClient(AppConfigDataClient);
  const encoder = new TextEncoder();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('when called and a default provider does not exist, it instantiates one and returns the value', async () => {
    // Prepare
    const options: GetAppConfigCombinedInterface = {
      application: 'MyApp',
      environment: 'MyAppProdEnv',
    };
    const name = 'MyAppFeatureFlag';
    const mockInitialToken =
      'AYADeNgfsRxdKiJ37A12OZ9vN2cAXwABABVhd3MtY3J5cHRvLXB1YmxpYy1rZXkAREF1RzlLMTg1Tkx2Wjk4OGV2UXkyQ1';
    const mockNextToken =
      'ImRmyljpZnxt7FfxeEOE5H8xQF1SfOlWZFnHujbzJmIvNeSAAA8/qA9ivK0ElRMwpvx96damGxt125XtMkmYf6a0OWSqnBw==';
    const mockData = encoder.encode('myAppConfiguration');

    client
      .on(StartConfigurationSessionCommand)
      .resolves({
        InitialConfigurationToken: mockInitialToken,
      })
      .on(GetLatestConfigurationCommand)
      .resolves({
        Configuration: mockData,
        NextPollConfigurationToken: mockNextToken,
      });

    // Act
    const result = await getAppConfig(name, options);

    // Assess
    expect(result).toBe(mockData);
  });

  test('when called and a default provider exists, it uses it and returns the value', async () => {
    // Prepare
    const options: GetAppConfigCombinedInterface = {
      application: 'MyApp',
      environment: 'MyAppProdEnv',
    };
    const provider = new AppConfigProvider(options);
    DEFAULT_PROVIDERS.appconfig = provider;
    const name = 'MyAppFeatureFlag';
    const mockInitialToken =
      'AYADeNgfsRxdKiJ37A12OZ9vN2cAXwABABVhd3MtY3J5cHRvLXB1YmxpYy1rZXkAREF1RzlLMTg1Tkx2Wjk4OGV2UXkyQ1';
    const mockNextToken =
      'ImRmyljpZnxt7FfxeEOE5H8xQF1SfOlWZFnHujbzJmIvNeSAAA8/qA9ivK0ElRMwpvx96damGxt125XtMkmYf6a0OWSqnBw==';
    const mockData = encoder.encode('myAppConfiguration');

    client
      .on(StartConfigurationSessionCommand)
      .resolves({
        InitialConfigurationToken: mockInitialToken,
      })
      .on(GetLatestConfigurationCommand)
      .resolves({
        Configuration: mockData,
        NextPollConfigurationToken: mockNextToken,
      });

    // Act
    const result = await getAppConfig(name, options);

    // Assess
    expect(result).toBe(mockData);
  });

  test('when called with transform: `binary` option, it returns string value', async () => {
    // Prepare
    const options: GetAppConfigCombinedInterface = {
      application: 'MyApp',
      environment: 'MyAppProdEnv',
      transform: 'binary',
    };

    const name = 'MyAppFeatureFlag';
    const mockInitialToken =
      'AYADeNgfsRxdKiJ37A12OZ9vN2cAXwABABVhd3MtY3J5cHRvLXB1YmxpYy1rZXkAREF1RzlLMTg1Tkx2Wjk4OGV2UXkyQ1';
    const mockNextToken =
      'ImRmyljpZnxt7FfxeEOE5H8xQF1SfOlWZFnHujbzJmIvNeSAAA8/qA9ivK0ElRMwpvx96damGxt125XtMkmYf6a0OWSqnBw==';
    const expectedValue = 'my-value';
    const mockData = encoder.encode(toBase64(encoder.encode(expectedValue)));

    client
      .on(StartConfigurationSessionCommand)
      .resolves({
        InitialConfigurationToken: mockInitialToken,
      })
      .on(GetLatestConfigurationCommand)
      .resolves({
        Configuration: mockData,
        NextPollConfigurationToken: mockNextToken,
      });

    // Act
    const result = await getAppConfig(name, options);

    // Assess
    expect(result).toBe(expectedValue);
  });
});

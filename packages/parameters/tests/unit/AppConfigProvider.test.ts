/**
 * Test AppConfigProvider class
 *
 * @group unit/parameters/AppConfigProvider/class
 */
import { AppConfigProvider } from '../../src/AppConfigProvider';
import {
  AppConfigDataClient,
  StartConfigurationSessionCommand,
  GetLatestConfigurationCommand,
} from '@aws-sdk/client-appconfigdata';
import { mockClient } from 'aws-sdk-client-mock';
import 'aws-sdk-client-mock-jest';

const encoder = new TextEncoder();

describe('Class: AppConfigProvider', () => {
  const client = mockClient(AppConfigDataClient);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Method: _get', () => {
    test('when called with name and options, it gets binary configuration', async () => {
      // Prepare
      const options = {
        sdkOptions: {
          application: 'MyApp',
          environment: 'MyAppProdEnv',
        },
      };
      const provider = new AppConfigProvider(options);
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
      const result = await provider.get(name);

      // Assess
      expect(result).toBe(mockData);
    });
  });
});

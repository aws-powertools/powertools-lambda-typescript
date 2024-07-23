import { AppConfigProvider } from '@aws-lambda-powertools/parameters/appconfig';
import { Uint8ArrayBlobAdapter } from '@smithy/util-stream';
import { handler } from './testingYourCodeFunctionsHandler';

describe('Function tests', () => {
  const providerSpy = jest.spyOn(AppConfigProvider.prototype, 'get');

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('it retrieves the config once and uses the correct name', async () => {
    // Prepare
    const expectedConfig = {
      feature: {
        enabled: true,
        name: 'paywall',
      },
    };
    providerSpy.mockResolvedValueOnce(
      Uint8ArrayBlobAdapter.fromString(JSON.stringify(expectedConfig))
    );

    // Act
    const result = await handler({}, {});

    // Assess
    expect(result).toStrictEqual({ value: expectedConfig });
    expect(providerSpy).toHaveBeenCalledTimes(1);
    expect(providerSpy).toHaveBeenCalledWith('my-config');
  });
});

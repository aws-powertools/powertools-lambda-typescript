import { handler } from './testingYourCodeFunctionsHandler';
import { AppConfigProvider } from '@aws-lambda-powertools/parameters/appconfig';

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
    providerSpy.mockResolvedValueOnce(expectedConfig);

    // Act
    const result = await handler({}, {});

    // Assess
    expect(result).toStrictEqual({ value: expectedConfig });
    expect(providerSpy).toHaveBeenCalledTimes(1);
    expect(providerSpy).toHaveBeenCalledWith('my-config');

  });

});
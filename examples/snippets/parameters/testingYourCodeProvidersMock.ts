import { AppConfigProvider } from '@aws-lambda-powertools/parameters/appconfig';
import { Uint8ArrayBlobAdapter } from '@smithy/util-stream';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { handler } from './testingYourCodeFunctionsHandler.js';

describe('Function tests', () => {
  const providerSpy = vi.spyOn(AppConfigProvider.prototype, 'get');

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('retrieves the config once and uses the correct name', async () => {
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

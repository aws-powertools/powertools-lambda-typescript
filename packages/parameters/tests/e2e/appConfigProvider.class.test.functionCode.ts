import type { Context } from 'aws-lambda';
import { Transform } from '../../src/constants.js';
import { AppConfigProvider } from '../../src/appconfig/AppConfigProvider.js';
import { AppConfigGetOptions } from '../../src/types/AppConfigProvider.js';
import { TinyLogger } from '../helpers/tinyLogger.js';
import { middleware } from '../helpers/sdkMiddlewareRequestCounter.js';
import { AppConfigDataClient } from '@aws-sdk/client-appconfigdata';

// We use a custom logger to log pure JSON objects to stdout
const logger = new TinyLogger();

const application = process.env.APPLICATION_NAME || 'my-app';
const environment = process.env.ENVIRONMENT_NAME || 'my-env';
const freeFormJsonName = process.env.FREEFORM_JSON_NAME || 'freeform-json';
const freeFormYamlName = process.env.FREEFORM_YAML_NAME || 'freeform-yaml';
const freeFormBase64encodedPlainText =
  process.env.FREEFORM_BASE64_ENCODED_PLAIN_TEXT_NAME || 'freeform-plain-text';
const featureFlagName = process.env.FEATURE_FLAG_NAME || 'feature-flag';

const defaultProvider = new AppConfigProvider({
  application,
  environment,
});
// Provider test
const customClient = new AppConfigDataClient({});
customClient.middlewareStack.use(middleware);
const providerWithMiddleware = new AppConfigProvider({
  awsSdkV3Client: customClient,
  application,
  environment,
});

// Use provider specified, or default to main one & return it with cache cleared
const resolveProvider = (provider?: AppConfigProvider): AppConfigProvider => {
  const resolvedProvider = provider ? provider : defaultProvider;
  resolvedProvider.clearCache();

  return resolvedProvider;
};

// Helper function to call get() and log the result
const _call_get = async (
  paramName: string,
  testName: string,
  options?: AppConfigGetOptions,
  provider?: AppConfigProvider
): Promise<void> => {
  try {
    const currentProvider = resolveProvider(provider);

    const parameterValue = await currentProvider.get(paramName, options);
    logger.log({
      test: testName,
      value: parameterValue,
    });
  } catch (err) {
    logger.log({
      test: testName,
      error: (err as Error).message,
    });
  }
};

export const handler = async (
  _event: unknown,
  _context: Context
): Promise<void> => {
  // Test 1 - get a single parameter as-is (no transformation - should return an Uint8Array)
  await _call_get(freeFormYamlName, 'get');

  // Test 2 - get a free-form JSON and apply json transformation (should return an object)
  await _call_get(freeFormJsonName, 'get-freeform-json-binary', {
    transform: Transform.JSON,
  });

  // Test 3 - get a free-form base64-encoded plain text and apply binary transformation (should return a decoded string)
  await _call_get(
    freeFormBase64encodedPlainText,
    'get-freeform-base64-plaintext-binary',
    { transform: Transform.BINARY }
  );

  // Test 4 - get a feature flag and apply json transformation (should return an object)
  await _call_get(featureFlagName, 'get-feature-flag-binary', {
    transform: Transform.JSON,
  });

  // Test 5
  // get parameter twice with middleware, which counts the number of requests, we check later if we only called AppConfig API once
  try {
    providerWithMiddleware.clearCache();
    middleware.counter = 0;
    await providerWithMiddleware.get(freeFormBase64encodedPlainText);
    await providerWithMiddleware.get(freeFormBase64encodedPlainText);
    logger.log({
      test: 'get-cached',
      value: middleware.counter, // should be 1
    });
  } catch (err) {
    logger.log({
      test: 'get-cached',
      error: (err as Error).message,
    });
  }

  // Test 6
  // get parameter twice, but force fetch 2nd time, we count number of SDK requests and check that we made two API calls
  try {
    providerWithMiddleware.clearCache();
    middleware.counter = 0;
    await providerWithMiddleware.get(freeFormBase64encodedPlainText);
    await providerWithMiddleware.get(freeFormBase64encodedPlainText, {
      forceFetch: true,
    });
    logger.log({
      test: 'get-forced',
      value: middleware.counter, // should be 2
    });
  } catch (err) {
    logger.log({
      test: 'get-forced',
      error: (err as Error).message,
    });
  }
  // Test 7
  // get parameter twice, using maxAge to avoid primary cache, count SDK calls and return values
  try {
    providerWithMiddleware.clearCache();
    middleware.counter = 0;
    const expiredResult1 = await providerWithMiddleware.get(
      freeFormBase64encodedPlainText,
      {
        maxAge: 0,
        transform: Transform.BINARY,
      }
    );
    const expiredResult2 = await providerWithMiddleware.get(
      freeFormBase64encodedPlainText,
      {
        maxAge: 0,
        transform: Transform.BINARY,
      }
    );
    logger.log({
      test: 'get-expired',
      value: {
        counter: middleware.counter, // should be 2
        result1: expiredResult1,
        result2: expiredResult2,
      },
    });
  } catch (err) {
    logger.log({
      test: 'get-expired',
      error: (err as Error).message,
    });
  }
};

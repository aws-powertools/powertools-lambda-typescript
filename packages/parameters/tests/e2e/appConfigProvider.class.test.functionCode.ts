import { Context } from 'aws-lambda';
import {
  AppConfigProvider,
} from '../../src/appconfig';
import {
  AppConfigGetOptionsInterface,
} from '../../src/types';
import { TinyLogger } from '../helpers/tinyLogger';
import { middleware } from '../helpers/sdkMiddlewareRequestCounter';
import { AppConfigDataClient } from '@aws-sdk/client-appconfigdata';

// We use a custom logger to log pure JSON objects to stdout
const logger = new TinyLogger();

const application = process.env.APPLICATION_NAME || 'my-app';
const environment = process.env.ENVIRONMENT_NAME || 'my-env';
const freeFormJsonName = process.env.FREEFORM_JSON_NAME || 'freeform-json';
const freeFormYamlName = process.env.FREEFORM_YAML_NAME || 'freeform-yaml';
const freeFormPlainTextNameA = process.env.FREEFORM_PLAIN_TEXT_NAME_A || 'freeform-plain-text';
const freeFormPlainTextNameB = process.env.FREEFORM_PLAIN_TEXT_NAME_B || 'freeform-plain-text';
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
  options?: AppConfigGetOptionsInterface,
  provider?: AppConfigProvider,
): Promise<void> => {
  try {
    const currentProvider = resolveProvider(provider);

    const parameterValue = await currentProvider.get(paramName, options);
    logger.log({
      test: testName,
      value: parameterValue
    });
  } catch (err) {
    logger.log({
      test: testName,
      error: err.message
    });
  }
};

export const handler = async (_event: unknown, _context: Context): Promise<void> => {
  // Test 1 - get a single parameter as-is (no transformation)
  await _call_get(freeFormPlainTextNameA, 'get');

  // Test 2 - get a free-form JSON and apply binary transformation (should return a stringified JSON)
  await _call_get(freeFormJsonName, 'get-freeform-json-binary', { transform: 'binary' });

  // Test 3 - get a free-form YAML and apply binary transformation (should return a string-encoded YAML)
  await _call_get(freeFormYamlName, 'get-freeform-yaml-binary', { transform: 'binary' });

  // Test 4 - get a free-form plain text and apply binary transformation (should return a string)
  await _call_get(freeFormPlainTextNameB, 'get-freeform-plain-text-binary', { transform: 'binary' });

  // Test 5 - get a feature flag and apply binary transformation (should return a stringified JSON)
  await _call_get(featureFlagName, 'get-feature-flag-binary', { transform: 'binary' });

  // Test 6
  // get parameter twice with middleware, which counts the number of requests, we check later if we only called AppConfig API once
  try {
    providerWithMiddleware.clearCache();
    middleware.counter = 0;
    await providerWithMiddleware.get(freeFormPlainTextNameA);
    await providerWithMiddleware.get(freeFormPlainTextNameA);
    logger.log({
      test: 'get-cached',
      value: middleware.counter // should be 1
    });
  } catch (err) {
    logger.log({
      test: 'get-cached',
      error: err.message
    });
  }

  // Test 7
  // get parameter twice, but force fetch 2nd time, we count number of SDK requests and check that we made two API calls
  try {
    providerWithMiddleware.clearCache();
    middleware.counter = 0;
    await providerWithMiddleware.get(freeFormPlainTextNameA);
    await providerWithMiddleware.get(freeFormPlainTextNameA, { forceFetch: true });
    logger.log({
      test: 'get-forced',
      value: middleware.counter // should be 2
    });
  } catch (err) {
    logger.log({
      test: 'get-forced',
      error: err.message
    });
  }
};
import { Context } from 'aws-lambda';
import { TinyLogger } from '../helpers/tinyLogger.js';
import { SecretsManagerClient } from '@aws-sdk/client-secrets-manager';
import { middleware } from '../helpers/sdkMiddlewareRequestCounter.js';
import { Transform } from '../../src/constants.js';
import { SecretsProvider } from '../../src/secrets/SecretsProvider.js';
import { SecretsGetOptions } from '../../src/types/SecretsProvider.js';

const logger = new TinyLogger();
const defaultProvider = new SecretsProvider();

const secretNamePlain = process.env.SECRET_NAME_PLAIN || '';
const secretNameObject = process.env.SECRET_NAME_OBJECT || '';
const secretNameBinary = process.env.SECRET_NAME_BINARY || '';
const secretNamePlainChached = process.env.SECRET_NAME_PLAIN_CACHED || '';
const secretNamePlainForceFetch =
  process.env.SECRET_NAME_PLAIN_FORCE_FETCH || '';

// Provider test 8, 9
const customClient = new SecretsManagerClient({});
customClient.middlewareStack.use(middleware);
const providerWithMiddleware = new SecretsProvider({
  awsSdkV3Client: customClient,
});

const _call_get = async (
  paramName: string,
  testName: string,
  options?: SecretsGetOptions,
  provider?: SecretsProvider
): Promise<void> => {
  try {
    // we might get a provider with specific sdk options, otherwise fallback to default
    const currentProvider = provider ? provider : defaultProvider;

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
  // Test 1 get single secret as plaintext
  await _call_get(secretNamePlain, 'get-plain');

  // Test 2 get single secret with transform json
  await _call_get(secretNameObject, 'get-transform-json', {
    transform: Transform.JSON,
  });

  // Test 3 get single secret with transform binary
  await _call_get(secretNameBinary, 'get-transform-binary', {
    transform: Transform.BINARY,
  });

  // Test 4
  // get secret twice with middleware, which counts number of SDK requests, we check later if we only called SecretManager API once
  try {
    middleware.counter = 0;
    await providerWithMiddleware.get(secretNamePlainChached);
    await providerWithMiddleware.get(secretNamePlainChached);
    logger.log({
      test: 'get-plain-cached',
      value: middleware.counter, // should be 1
    });
  } catch (err) {
    logger.log({
      test: secretNamePlainChached,
      error: (err as Error).message,
    });
  }
  // Test 5
  // get secret twice, but force fetch 2nd time, we count number of SDK requests and  check that we made two API calls
  try {
    middleware.counter = 0;
    providerWithMiddleware.clearCache();
    await providerWithMiddleware.get(secretNamePlainForceFetch);
    await providerWithMiddleware.get(secretNamePlainForceFetch, {
      forceFetch: true,
    });
    logger.log({
      test: 'get-plain-force',
      value: middleware.counter, // should be 2
    });
  } catch (err) {
    logger.log({
      test: secretNamePlainChached,
      error: (err as Error).message,
    });
  }
};

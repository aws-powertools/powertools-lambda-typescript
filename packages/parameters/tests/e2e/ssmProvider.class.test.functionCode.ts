import type { Context } from 'aws-lambda';
import { SSMProvider } from '../../src/ssm/SSMProvider.js';
import {
  SSMGetOptions,
  SSMGetMultipleOptions,
  SSMGetParametersByNameOptions,
} from '../../src/types/SSMProvider.js';
import { TinyLogger } from '../helpers/tinyLogger.js';
import { middleware } from '../helpers/sdkMiddlewareRequestCounter.js';
import { SSMClient } from '@aws-sdk/client-ssm';

// We use a custom logger to log pure JSON objects to stdout
const logger = new TinyLogger();

const defaultProvider = new SSMProvider();
// Provider test 8, 9
const customClient = new SSMClient({});
customClient.middlewareStack.use(middleware);
const providerWithMiddleware = new SSMProvider({
  awsSdkV3Client: customClient,
});

const paramA = process.env.PARAM_A ?? 'my-param';
const paramB = process.env.PARAM_B ?? 'my-param';
const paramEncryptedA = process.env.PARAM_ENCRYPTED_A ?? 'my-encrypted-param';
const paramEncryptedB = process.env.PARAM_ENCRYPTED_B ?? 'my-encrypted-param';

// Use provider specified, or default to main one & return it with cache cleared
const resolveProvider = (provider?: SSMProvider): SSMProvider => {
  const resolvedProvider = provider ? provider : defaultProvider;
  resolvedProvider.clearCache();

  return resolvedProvider;
};

// Helper function to call get() and log the result
const _call_get = async (
  paramName: string,
  testName: string,
  options?: SSMGetOptions,
  provider?: SSMProvider
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

// Helper function to call getMultiple() and log the result
const _call_get_multiple = async (
  paramPath: string,
  testName: string,
  options?: SSMGetMultipleOptions,
  provider?: SSMProvider
): Promise<void> => {
  try {
    const currentProvider = resolveProvider(provider);

    const parameterValues = await currentProvider.getMultiple(
      paramPath,
      options
    );
    logger.log({
      test: testName,
      value: parameterValues,
    });
  } catch (err) {
    logger.log({
      test: testName,
      error: (err as Error).message,
    });
  }
};

// Helper function to call getParametersByName() and log the result
const _call_get_parameters_by_name = async (
  params: Record<string, SSMGetParametersByNameOptions>,
  testName: string,
  options?: SSMGetParametersByNameOptions,
  provider?: SSMProvider
): Promise<void> => {
  try {
    const currentProvider = resolveProvider(provider);

    const parameterValues = await currentProvider.getParametersByName(
      params,
      options
    );
    logger.log({
      test: testName,
      value: parameterValues,
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
  // Test 1 - get a single parameter by name with default options
  await _call_get(paramA, 'get');

  // Test 2 - get a single parameter by name with decrypt
  await _call_get(paramEncryptedA, 'get-decrypt', { decrypt: true });

  // Test 3 - get multiple parameters by path with default options
  // Get path (/param/get)
  const parameterPath = paramA.substring(0, paramA.lastIndexOf('/'));
  await _call_get_multiple(parameterPath, 'get-multiple');

  // Test 4 - get multiple parameters by path recursively (aka. get all parameters under a path recursively)
  // Get parameters root (i.e. from /param/get/a & /param/get/b to /param)
  const parameterRoot = paramA.substring(
    0,
    paramA.substring(1, paramA.length).indexOf('/') + 1
  );
  await _call_get_multiple(parameterRoot, 'get-multiple-recursive', {
    recursive: true,
  });

  // Test 5 - get multiple parameters by path with decrypt
  // Get parameters path (i.e. from /param/get/a & /param/get/b to /param/get)
  const parameterPathDecrypt = paramEncryptedA.substring(
    0,
    paramEncryptedA.lastIndexOf('/')
  );
  await _call_get_multiple(parameterPathDecrypt, 'get-multiple-decrypt', {
    decrypt: true,
  });

  // Test 6 - get multiple parameters by name with default options
  await _call_get_parameters_by_name(
    {
      [paramA]: {},
      [paramB]: {},
    },
    'get-multiple-by-name'
  );

  // Test 7 - get multiple parameters by name, some of them encrypted and some not
  await _call_get_parameters_by_name(
    {
      [paramA]: {},
      [paramEncryptedA]: { decrypt: true },
      [paramEncryptedB]: { decrypt: true },
    },
    'get-multiple-by-name-mixed-decrypt'
  );

  // Test 8
  // get parameter twice with middleware, which counts the number of requests, we check later if we only called SSM API once
  try {
    providerWithMiddleware.clearCache();
    middleware.counter = 0;
    await providerWithMiddleware.get(paramA);
    await providerWithMiddleware.get(paramA);
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

  // Test 9
  // get parameter twice, but force fetch 2nd time, we count number of SDK requests and check that we made two API calls
  try {
    providerWithMiddleware.clearCache();
    middleware.counter = 0;
    await providerWithMiddleware.get(paramA);
    await providerWithMiddleware.get(paramA, { forceFetch: true });
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
};

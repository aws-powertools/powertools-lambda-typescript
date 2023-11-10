import type { Context } from 'aws-lambda';
import { Transform } from '../../src/constants.js';
import { DynamoDBProvider } from '../../src/dynamodb/DynamoDBProvider.js';
import {
  DynamoDBGetOptions,
  DynamoDBGetMultipleOptions,
} from '../../src/types/DynamoDBProvider.js';
import { TinyLogger } from '../helpers/tinyLogger.js';
import { middleware } from '../helpers/sdkMiddlewareRequestCounter.js';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';

// We use a custom logger to log pure JSON objects to stdout
const logger = new TinyLogger();

const tableGet = process.env.TABLE_GET ?? 'my-table';
const tableGetMultiple = process.env.TABLE_GET_MULTIPLE ?? 'my-table';
const tableGetCustomkeys = process.env.TABLE_GET_CUSTOM_KEYS ?? 'my-table';
const tableGetMultipleCustomkeys =
  process.env.TABLE_GET_MULTIPLE_CUSTOM_KEYS ?? 'my-table';
const keyAttr = process.env.KEY_ATTR ?? 'id';
const sortAttr = process.env.SORT_ATTR ?? 'sk';
const valueAttr = process.env.VALUE_ATTR ?? 'value';

// Provider test 1, 5, 6
const providerGet = new DynamoDBProvider({
  tableName: tableGet,
});
// Provider test 2, 7
const providerGetMultiple = new DynamoDBProvider({
  tableName: tableGetMultiple,
});
// Provider test 3
const providerGetCustomKeys = new DynamoDBProvider({
  tableName: tableGetCustomkeys,
  keyAttr,
  valueAttr,
});
// Provider 4
const providerGetMultipleCustomKeys = new DynamoDBProvider({
  tableName: tableGetMultipleCustomkeys,
  keyAttr,
  sortAttr,
  valueAttr,
});

// Provider test 8, 9
const customClient = new DynamoDBClient({});
customClient.middlewareStack.use(middleware);
const providerWithMiddleware = new DynamoDBProvider({
  awsSdkV3Client: customClient,
  tableName: tableGet,
});

// Helper function to call get() and log the result
const _call_get = async (
  paramName: string,
  testName: string,
  provider: DynamoDBProvider,
  options?: DynamoDBGetOptions
): Promise<void> => {
  try {
    const parameterValue = await provider.get(paramName, options);
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
  provider: DynamoDBProvider,
  options?: DynamoDBGetMultipleOptions
): Promise<void> => {
  try {
    const parameterValues = await provider.getMultiple(paramPath, options);
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
  // Test 1 - get a single parameter with default options (keyAttr: 'id', valueAttr: 'value')
  await _call_get('my-param', 'get', providerGet);

  // Test 2 - get multiple parameters with default options (keyAttr: 'id', sortAttr: 'sk', valueAttr: 'value')
  await _call_get_multiple('my-params', 'get-multiple', providerGetMultiple);

  // Test 3 - get a single parameter with custom options (keyAttr: 'key', valueAttr: 'val')
  await _call_get('my-param', 'get-custom', providerGetCustomKeys);

  // Test 4 - get multiple parameters with custom options (keyAttr: 'key', sortAttr: 'sort', valueAttr: 'val')
  await _call_get_multiple(
    'my-params',
    'get-multiple-custom',
    providerGetMultipleCustomKeys
  );

  // Test 5 - get a single parameter with json transform
  await _call_get('my-param-json', 'get-json-transform', providerGet, {
    transform: Transform.JSON,
  });

  // Test 6 - get a single parameter with binary transform
  await _call_get('my-param-binary', 'get-binary-transform', providerGet, {
    transform: Transform.BINARY,
  });

  // Test 7 - get multiple parameters with auto transform
  await _call_get_multiple(
    'my-encoded-params',
    'get-multiple-auto-transform',
    providerGetMultiple,
    {
      transform: Transform.AUTO,
    }
  );

  // Test 8
  // get parameter twice with middleware, which counts the number of requests, we check later if we only called DynamoDB once
  try {
    providerWithMiddleware.clearCache();
    middleware.counter = 0;
    await providerWithMiddleware.get('my-param');
    await providerWithMiddleware.get('my-param');
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
    await providerWithMiddleware.get('my-param');
    await providerWithMiddleware.get('my-param', { forceFetch: true });
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

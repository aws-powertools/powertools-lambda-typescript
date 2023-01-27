import { Context } from 'aws-lambda';
import { DynamoDBProvider } from '../../src/dynamodb';
import { TinyLogger } from '../helpers/tinyLogger';
// # TODO: Uncomment code below once #1222 is fixed
/*
import { middleware } from '../helpers/sdkMiddlewareRequestCounter';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
*/

const tableGet = process.env.TABLE_GET ?? 'my-table';
const tableGetMultiple = process.env.TABLE_GET_MULTIPLE ?? 'my-table';
const tableGetCustomkeys = process.env.TABLE_GET_CUSTOM_KEYS ?? 'my-table';
const tableGetMultipleCustomkeys = process.env.TABLE_GET_MULTIPLE_CUSTOM_KEYS ?? 'my-table';
const keyAttr = process.env.KEY_ATTR ?? 'id';
const sortAttr = process.env.SORT_ATTR ?? 'sk';
const valueAttr = process.env.VALUE_ATTR ?? 'value';

// We use a custom logger to log pure JSON objects to stdout
const logger = new TinyLogger();

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
// # TODO: Uncomment code below once #1222 is fixed
/* 
// Provider test 8, 9
const customClient = new DynamoDBClient({});
providerWithMiddleware.middlewareStack.use(middleware);
const providerWithMiddleware = new DynamoDBProvider({
  awsSdkV3Client: customClient
});
*/

export const handler = async (_event: unknown, _context: Context): Promise<void> => {
  // Test 1 - get a single parameter with default options (keyAttr: 'id', valueAttr: 'value')
  try {
    const parameterValue = await providerGet.get('my-param');
    logger.log({
      test: 'get',
      value: parameterValue
    });
  } catch (err) {
    logger.log({
      test: 'get',
      error: err.message
    });
  }

  // Test 2 - get multiple parameters with default options (keyAttr: 'id', sortAttr: 'sk', valueAttr: 'value')
  try {
    const parametersValues = await providerGetMultiple.getMultiple('my-params');
    logger.log({
      test: 'get-multiple',
      value: parametersValues
    });
  } catch (err) {
    logger.log({
      test: 'get-multiple',
      error: err.message
    });
  }
  
  // Test 3 - get a single parameter with custom options (keyAttr: 'key', valueAttr: 'val')
  try {
    const parameterValueCustom = await providerGetCustomKeys.get('my-param');
    logger.log({
      test: 'get-custom',
      value: parameterValueCustom
    });
  } catch (err) {
    logger.log({
      test: 'get-custom',
      error: err.message
    });
  }

  // Test 4 - get multiple parameters with custom options (keyAttr: 'key', sortAttr: 'sort', valueAttr: 'val')
  try {
    const parametersValuesCustom = await providerGetMultipleCustomKeys.getMultiple('my-params');
    logger.log({
      test: 'get-multiple-custom',
      value: parametersValuesCustom
    });
  } catch (err) {
    logger.log({
      test: 'get-multiple-custom',
      error: err.message
    });
  }

  // Test 5 - get a single parameter with json transform
  try {
    const parameterValueJson = await providerGet.get('my-param-json', {
      transform: 'json'
    });
    logger.log({
      test: 'get-json-transform',
      value: typeof parameterValueJson // should be object
    });
  } catch (err) {
    logger.log({
      test: 'get-json-transform',
      error: err.message
    });
  }
  
  // Test 6 - get a single parameter with binary transform
  try {
    const parameterValueBinary = await providerGet.get('my-param-binary', {
      transform: 'binary'
    });
    logger.log({
      test: 'get-binary-transform',
      value: typeof parameterValueBinary // should be string
    });
  } catch (err) {
    logger.log({
      test: 'get-binary-transform',
      error: err.message
    });
  }

  // Test 7 - get multiple parameters with auto transform
  try {
    const parametersValuesAuto = await providerGetMultiple.getMultiple('my-encoded-params', {
      transform: 'auto'
    });
    if (!parametersValuesAuto) throw new Error('parametersValuesAuto is undefined');
    
    logger.log({
      test: 'get-multiple-auto-transform',
      value:
        `${typeof parametersValuesAuto['config.json']},${typeof parametersValuesAuto['key.binary']}` // should be object,string
    });
  } catch (err) {
    logger.log({
      test: 'get-multiple-auto-transform',
      error: err.message
    });
  }

  // # TODO: Uncomment code below once #1222 is fixed
  /**
   * Test 8 - get a parameter twice, second time should be cached
   *  
   * Should only make 1 request, we use middleware to count requests
   */
  /*
  try {
    await providerWithMiddleware.get('my-param');
    await providerWithMiddleware.get('my-param');
    logger.log({
      test: 'get-cache-request-count',
      value: middleware.requestCount
    });
  } catch (err) {
    logger.log({
      test: 'get-cache-request-count',
      error: err.message
    });
  }
  */

  /**
   * Test 9 - get a parameter once more but with forceFetch = true
   * 
   * Request count should increase to 2, we use middleware to count requests
   */
  /*
  try {
    await providerWithMiddleware.get('my-param', { forceFetch: true });
    logger.log({
      test: 'get-force-fetch-request-count',
      value: middleware.requestCount
    });
  } catch (err) {
    logger.log({
      test: 'get-force-fetch-request-count',
      error: err.message
    });
  }
  */
};
import { Context } from 'aws-lambda';
import { SSMProvider } from '../../src/ssm';
import { TinyLogger } from '../helpers/tinyLogger';
// # TODO: Uncomment code below once #1222 is fixed
/*
import { middleware } from '../helpers/sdkMiddlewareRequestCounter';
import { SSMClient } from '@aws-sdk/client-ssm';
*/

const paramA = process.env.PARAM_A ?? 'my-param';
const paramB = process.env.PARAM_B ?? 'my-param';
const paramEncryptedA = process.env.PARAM_ENCRYPTED_A ?? 'my-encrypted-param';
const paramEncryptedB = process.env.PARAM_ENCRYPTED_B ?? 'my-encrypted-param';

// We use a custom logger to log pure JSON objects to stdout
const logger = new TinyLogger();

// Provider test 1
const providerGet = new SSMProvider();

export const handler = async (_event: unknown, _context: Context): Promise<void> => {
  // Test 1 - get a single parameter with default options
  try {
    const parameterValue = await providerGet.get(paramA);
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
  
  // Test 2 - get a single parameter with decrypt
  try {
    const parameterValue = await providerGet.get(paramEncryptedA, { decrypt: true });
    logger.log({
      test: 'get-decrypt',
      value: parameterValue
    });
  } catch (err) {
    logger.log({
      test: 'get-decrypt',
      error: err.message
    });
  }
  
  // Test 3 - get multiple parameters with default options
  try {
    // Get path (/param/get)
    const parameterPath = paramA.substring(0, paramA.lastIndexOf('/'));
    const parameterValues = await providerGet.getMultiple(parameterPath);
    logger.log({
      test: 'get-multiple',
      value: parameterValues
    });
  } catch (err) {
    logger.log({
      test: 'get-multiple',
      error: err.message
    });
  }
  
  // Test 4 - get multiple parameters with recursive (aka. get all parameters under a path recursively)
  try {
    // Get parameters root (i.e. from /param/get/a & /param/get/b to /param)
    const parameterRoot = paramA.substring(
      0,
      paramA.substring(1, paramA.length).indexOf('/') + 1
    );
    const parameterValues = await providerGet.getMultiple(parameterRoot, { recursive: true });
    logger.log({
      test: 'get-multiple-recursive',
      value: parameterValues
    });
  } catch (err) {
    logger.log({
      test: 'get-multiple-recursive',
      error: err.message
    });
  }

  // Test 5 - get multiple parameters with decrypt
  try {
    // Get parameters path (i.e. from /param/get/a & /param/get/b to /param/get)
    const parameterPath = paramEncryptedA.substring(0, paramEncryptedA.lastIndexOf('/'));
    const parameterValues = await providerGet.getMultiple(parameterPath, { decrypt: true });
    logger.log({
      test: 'get-multiple-decrypt',
      value: parameterValues
    });
  } catch (err) {
    logger.log({
      test: 'get-multiple-decrypt',
      error: err.message
    });
  }

  // Test 6 - get multiple parameters by name with default options
  try {
    const parameterValues = await providerGet.getParametersByName({
      [paramA]: {},
      [paramB]: {},
    });
    logger.log({
      test: 'get-multiple-by-name',
      value: parameterValues
    });
  } catch (err) {
    logger.log({
      test: 'get-multiple-by-name',
      error: err.message
    });
  }

  // Test 7 - get multiple parameters by name with mixed decrypt
  try {
    const parameterValues = await providerGet.getParametersByName({
      [paramA]: {},
      [paramEncryptedA]: { decrypt: true },
      [paramEncryptedB]: { decrypt: true },
    });
    logger.log({
      test: 'get-multiple-by-name-mixed-decrypt',
      value: parameterValues
    });
  } catch (err) {
    logger.log({
      test: 'get-multiple-by-name-mixed-decrypt',
      error: err.message
    });
  }
};
import { Context } from 'aws-lambda';
import { SecretsProvider } from '../../lib/secrets';
import { TinyLogger } from '../helpers/tinyLogger';
import { SecretsGetOptionsInterface } from '../../lib/types';

const logger = new TinyLogger();
const defaultProvider = new SecretsProvider();

const secretNamePlain = process.env.SECRET_NAME_PLAIN || '';
const secretNameObject = process.env.SECRET_NAME_OBJECT || '';
const secretNameBinary = process.env.SECRET_NAME_BINARY || '';
const secretNameObjectWithSuffix = process.env.SECRET_NAME_OBJECT_WITH_SUFFIX || '';
const secretNameBinaryWithSuffix = process.env.SECRET_NAME_BINARY_WITH_SUFFIX || '';

const _call_get = async (paramName: string, testName: string, options?: SecretsGetOptionsInterface, provider?: SecretsProvider,): Promise<void> => {
  try {
    // we might get a provider with specific sdk options, otherwise fallback to default
    const currentProvider = provider ? provider : defaultProvider;

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

  // Test 1 get single param as plaintext
  await _call_get(secretNamePlain, 'get-plain');

  // Test 2 get single param with transform json
  await _call_get(secretNameObject, 'get-transform-json', { transform: 'json' });

  // Test 3 get single param with transform binary
  await _call_get(secretNameBinary, 'get-transform-binary', { transform: 'binary' });

  // Test 4 get single param with transform auto json
  await _call_get(secretNameObjectWithSuffix, 'get-transform-auto-json', { transform: 'auto' });

  // Test 5 get single param with transform auto binary
  await _call_get(secretNameBinaryWithSuffix, 'get-transform-auto-binary', { transform: 'auto' });

  // TOOD: add more tests once we can pass sdk configuration to the provider, after #1222 closed

};


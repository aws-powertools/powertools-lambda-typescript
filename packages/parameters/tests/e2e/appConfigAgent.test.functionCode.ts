import type { Context } from 'aws-lambda';
import { getConfig } from '../../src/appconfig-agent/index.js';
import type { GetConfigOptions } from '../../src/types/AppConfigAgent.js';
import { TinyLogger } from '../helpers/tinyLogger.js';

// We use a custom logger to log pure JSON objects to stdout
const logger = new TinyLogger();

const application = process.env.APPLICATION_NAME || 'my-app';
const environment = process.env.ENVIRONMENT_NAME || 'my-env';
const freeFormJsonName = process.env.FREEFORM_JSON_NAME || 'freeform-json';
const freeFormYamlName = process.env.FREEFORM_YAML_NAME || 'freeform-yaml';
const freeFormBase64encodedPlainText =
  process.env.FREEFORM_BASE64_ENCODED_PLAIN_TEXT_NAME || 'freeform-plain-text';
const featureFlagName = process.env.FEATURE_FLAG_NAME || 'feature-flag';

// Helper function to call getConfig() and log the result
const _call_get = async (
  name: string,
  testName: string,
  options?: Omit<GetConfigOptions, 'environment' | 'application'>
): Promise<void> => {
  try {
    const value = await getConfig(name, {
      application,
      environment,
      timeout: 5000,
      ...options,
    } as GetConfigOptions);
    logger.log({
      test: testName,
      value,
    });
  } catch (err) {
    logger.log({
      test: testName,
      error: (err as Error).name,
    });
  }
};

export const handler = async (
  _event: unknown,
  _context: Context
): Promise<void> => {
  // Test 1 - get a configuration as-is (no transformation - should return a string)
  await _call_get(freeFormYamlName, 'get');

  // Test 2 - get a free-form JSON and apply json transformation (should return an object)
  await _call_get(freeFormJsonName, 'get-freeform-json', {
    transform: 'json',
  });

  // Test 3 - get a free-form base64-encoded plain text and apply binary transformation (should return a decoded string)
  await _call_get(
    freeFormBase64encodedPlainText,
    'get-freeform-base64-plaintext-binary',
    { transform: 'binary' }
  );

  // Test 4 - get a feature flag and apply json transformation (should return an object)
  await _call_get(featureFlagName, 'get-feature-flag', {
    transform: 'json',
  });

  // Test 5 - get a configuration that does not exist (should throw a GetParameterError)
  await _call_get('does-not-exist', 'get-missing');
};

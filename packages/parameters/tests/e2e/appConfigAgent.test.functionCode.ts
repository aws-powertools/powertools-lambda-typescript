import { getConfig } from '../../src/appconfig-agent/index.js';

const application = process.env.APPLICATION_NAME || 'my-app';
const environment = process.env.ENVIRONMENT_NAME || 'my-env';
const freeFormJsonName = process.env.FREEFORM_JSON_NAME || 'freeform-json';
const freeFormYamlName = process.env.FREEFORM_YAML_NAME || 'freeform-yaml';
const freeFormBase64encodedPlainText =
  process.env.FREEFORM_BASE64_ENCODED_PLAIN_TEXT_NAME || 'freeform-plain-text';
const featureFlagName = process.env.FEATURE_FLAG_NAME || 'feature-flag';

/**
 * The handler returns the results of each `getConfig` call as the invocation
 * payload, so the test file can assert on them directly. If any of the calls
 * unexpectedly throws, the function crashes and the invocation reports a
 * `FunctionError`, failing the test suite loudly.
 */
export const handler = async (): Promise<Record<string, unknown>> => {
  // Test 1 - get a configuration as-is (no transformation - should return a string)
  const raw = await getConfig(freeFormYamlName, {
    application,
    environment,
    timeout: 5000,
  });

  // Test 2 - get a free-form JSON and apply json transformation (should return an object)
  const json = await getConfig(freeFormJsonName, {
    application,
    environment,
    timeout: 5000,
    transform: 'json',
  });

  // Test 3 - get a free-form base64-encoded plain text and apply binary transformation (should return a decoded string)
  const binary = await getConfig(freeFormBase64encodedPlainText, {
    application,
    environment,
    timeout: 5000,
    transform: 'binary',
  });

  // Test 4 - get a feature flag and apply json transformation (should return an object with the evaluated flag values)
  const featureFlag = await getConfig(featureFlagName, {
    application,
    environment,
    timeout: 5000,
    transform: 'json',
  });

  // Test 5 - get a configuration that does not exist (should throw a GetParameterError)
  let missingConfigErrorName = 'no error thrown';
  try {
    await getConfig('does-not-exist', {
      application,
      environment,
      timeout: 5000,
    });
  } catch (error) {
    missingConfigErrorName = (error as Error).name;
  }

  return {
    raw,
    json,
    binary,
    featureFlag,
    missingConfigErrorName,
  };
};

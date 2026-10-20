import { getConfig } from '../../src/appconfig-agent/index.js';

const application = process.env.APPLICATION_NAME ?? 'my-app';
const environment = process.env.ENVIRONMENT_NAME ?? 'my-env';
const freeFormJsonName = process.env.FREEFORM_JSON_NAME ?? 'freeform-json';
const freeFormYamlName = process.env.FREEFORM_YAML_NAME ?? 'freeform-yaml';
const freeFormBase64encodedPlainText =
  process.env.FREEFORM_BASE64_ENCODED_PLAIN_TEXT_NAME ?? 'freeform-plain-text';
const featureFlagName = process.env.FEATURE_FLAG_NAME ?? 'feature-flag';

// The first request for each configuration makes the agent call AppConfig on
// the spot, so we allow more than the default timeout to absorb cold starts.
const baseOptions = {
  application,
  environment,
  timeout: 5000,
} as const;

// Captures the name of the error thrown when requesting a configuration that
// doesn't exist with `throwOnMissing` enabled, so the test file can assert on it.
const getMissingConfigErrorName = async (): Promise<string> => {
  try {
    await getConfig('does-not-exist', { ...baseOptions, throwOnMissing: true });
    return 'no error thrown';
  } catch (error) {
    return (error as Error).name;
  }
};

// Requests a configuration that doesn't exist without `throwOnMissing`, and
// reports whether the default behavior returned undefined.
const isMissingConfigUndefined = async (): Promise<boolean> => {
  const value = await getConfig('does-not-exist', baseOptions);
  return value === undefined;
};

/**
 * The handler returns the results of each `getConfig` call as the invocation
 * payload, so the test file can assert on them directly. If any of the calls
 * unexpectedly throws, the function crashes and the invocation reports a
 * `FunctionError`, failing the test suite loudly.
 */
export const handler = async (): Promise<Record<string, unknown>> => {
  const [
    raw,
    json,
    binary,
    featureFlag,
    missingConfigErrorName,
    missingConfigIsUndefined,
  ] = await Promise.all([
    // Test 1 - get a configuration as-is (no transformation - should return a string)
    getConfig(freeFormYamlName, baseOptions),
    // Test 2 - get a free-form JSON and apply json transformation (should return an object)
    getConfig(freeFormJsonName, { ...baseOptions, transform: 'json' }),
    // Test 3 - get a free-form base64-encoded plain text and apply binary transformation (should return a decoded string)
    getConfig(freeFormBase64encodedPlainText, {
      ...baseOptions,
      transform: 'binary',
    }),
    // Test 4 - get a feature flag and apply json transformation (should return an object with the evaluated flag values)
    getConfig(featureFlagName, { ...baseOptions, transform: 'json' }),
    // Test 5 - get a configuration that does not exist with throwOnMissing (should throw a ParameterNotFoundError)
    getMissingConfigErrorName(),
    // Test 6 - get a configuration that does not exist (should return undefined)
    isMissingConfigUndefined(),
  ]);

  return {
    raw,
    json,
    binary,
    featureFlag,
    missingConfigErrorName,
    missingConfigIsUndefined,
  };
};

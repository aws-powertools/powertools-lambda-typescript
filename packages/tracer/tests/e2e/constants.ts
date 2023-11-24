// Prefix for all resources created by the E2E tests
const RESOURCE_NAME_PREFIX = 'Tracer';
// Constants relating time to be used in the tests
const ONE_MINUTE = 60 * 1_000;
const TEST_CASE_TIMEOUT = 5 * ONE_MINUTE;
const SETUP_TIMEOUT = 7 * ONE_MINUTE;
const TEARDOWN_TIMEOUT = 5 * ONE_MINUTE;

// Expected values for custom annotations, metadata, and response
const commonEnvironmentVars = {
  EXPECTED_CUSTOM_ANNOTATION_KEY: 'myAnnotation',
  EXPECTED_CUSTOM_ANNOTATION_VALUE: 'myValue',
  EXPECTED_CUSTOM_METADATA_KEY: 'myMetadata',
  EXPECTED_CUSTOM_METADATA_VALUE: { bar: 'baz' },
  EXPECTED_CUSTOM_RESPONSE_VALUE: { foo: 'bar' },
  EXPECTED_CUSTOM_ERROR_MESSAGE: 'An error has occurred',
  POWERTOOLS_TRACER_CAPTURE_RESPONSE: 'true',
  POWERTOOLS_TRACER_CAPTURE_ERROR: 'true',
  POWERTOOLS_TRACE_ENABLED: 'true',
  EXPECTED_CUSTOM_SUBSEGMENT_NAME: 'mySubsegment',
};

export {
  RESOURCE_NAME_PREFIX,
  ONE_MINUTE,
  TEST_CASE_TIMEOUT,
  SETUP_TIMEOUT,
  TEARDOWN_TIMEOUT,
  commonEnvironmentVars,
};

// Prefix for all resources created by the E2E tests
const RESOURCE_NAME_PREFIX = 'Tracer-E2E';
// Constants relating time to be used in the tests
const ONE_MINUTE = 60 * 1_000;
const TEST_CASE_TIMEOUT = 5 * ONE_MINUTE;
const SETUP_TIMEOUT = 5 * ONE_MINUTE;
const TEARDOWN_TIMEOUT = 5 * ONE_MINUTE;

// Expected values for custom annotations, metadata, and response
const expectedCustomAnnotationKey = 'myAnnotation';
const expectedCustomAnnotationValue = 'myValue';
const expectedCustomMetadataKey = 'myMetadata';
const expectedCustomMetadataValue = { bar: 'baz' };
const expectedCustomResponseValue = { foo: 'bar' };
const expectedCustomErrorMessage = 'An error has occurred';
const expectedCustomSubSegmentName = 'mySubsegment';
const commonEnvironmentVariables = {
  EXPECTED_CUSTOM_ANNOTATION_KEY: expectedCustomAnnotationKey,
  EXPECTED_CUSTOM_ANNOTATION_VALUE: expectedCustomAnnotationValue,
  EXPECTED_CUSTOM_METADATA_KEY: expectedCustomMetadataKey,
  EXPECTED_CUSTOM_METADATA_VALUE: JSON.stringify(expectedCustomMetadataValue),
  EXPECTED_CUSTOM_RESPONSE_VALUE: JSON.stringify(expectedCustomResponseValue),
  EXPECTED_CUSTOM_ERROR_MESSAGE: expectedCustomErrorMessage,
};

export {
  RESOURCE_NAME_PREFIX,
  ONE_MINUTE,
  TEST_CASE_TIMEOUT,
  SETUP_TIMEOUT,
  TEARDOWN_TIMEOUT,
  expectedCustomAnnotationKey,
  expectedCustomAnnotationValue,
  expectedCustomMetadataKey,
  expectedCustomMetadataValue,
  expectedCustomResponseValue,
  expectedCustomErrorMessage,
  expectedCustomSubSegmentName,
  commonEnvironmentVariables,
};

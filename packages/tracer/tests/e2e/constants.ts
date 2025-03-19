// Prefix for all resources created by the E2E tests
const RESOURCE_NAME_PREFIX = 'Tracer';

// Expected values for custom annotations, metadata, and response
const EXPECTED_ANNOTATION_KEY = 'myAnnotation';
const EXPECTED_ANNOTATION_VALUE = 'myValue';
const EXPECTED_METADATA_KEY = 'myMetadata';
const EXPECTED_METADATA_VALUE = { bar: 'baz' };
const EXPECTED_RESPONSE_VALUE = { foo: 'bar' };
const EXPECTED_ERROR_MESSAGE = 'An error has occurred';
const EXPECTED_SUBSEGMENT_NAME = '### mySubsegment';

export {
  RESOURCE_NAME_PREFIX,
  EXPECTED_ANNOTATION_KEY,
  EXPECTED_ANNOTATION_VALUE,
  EXPECTED_METADATA_KEY,
  EXPECTED_METADATA_VALUE,
  EXPECTED_RESPONSE_VALUE,
  EXPECTED_ERROR_MESSAGE,
  EXPECTED_SUBSEGMENT_NAME,
};

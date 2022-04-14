export const RESOURCE_NAME_PREFIX = 'Tracer-E2E';
export const ONE_MINUTE = 60 * 10_00;
export const TEST_CASE_TIMEOUT = ONE_MINUTE * 2;
export const SETUP_TIMEOUT = 300_000;
export const TEARDOWN_TIMEOUT = 200_000;

export const expectedCustomAnnotationKey = 'myAnnotation';
export const expectedCustomAnnotationValue = 'myValue';
export const expectedCustomMetadataKey = 'myMetadata';
export const expectedCustomMetadataValue = { bar: 'baz' };
export const expectedCustomResponseValue = { foo: 'bar' };
export const expectedCustomErrorMessage = 'An error has occurred';


/**
 * A type that contains information for invoking a Lambda function,
 * and retrieving the traces.
 * 
 * We fill the information while creting Lambda functions with CDK, 
 * and reuse it later in the test cases
 */
export type InvocationMap = { 
  [key: string]: { 
    functionName: string
    serviceName: string
    resourceArn: string 
  }
};
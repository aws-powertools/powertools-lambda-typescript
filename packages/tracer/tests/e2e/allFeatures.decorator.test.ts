/**
 * Test tracer in decorator setup
 *
 * @group e2e/tracer/decorator
 */
import { join } from 'node:path';
import { TestStack } from '@aws-lambda-powertools/testing-utils';
import { TestDynamodbTable } from '@aws-lambda-powertools/testing-utils/resources/dynamodb';
import {
  getTraces,
  getTracesWithoutMainSubsegments,
} from '@aws-lambda-powertools/testing-utils/utils/xray-traces';
import { invokeAllTestCases } from '../helpers/invokeAllTests.js';
import { TracerTestNodejsFunction } from '../helpers/resources.js';
import {
  RESOURCE_NAME_PREFIX,
  SETUP_TIMEOUT,
  TEARDOWN_TIMEOUT,
  TEST_CASE_TIMEOUT,
  commonEnvironmentVars,
} from './constants.js';

/**
 * The test includes one stack with 4 Lambda functions that correspond to the following test cases:
 * 1. With all flags enabled (capture both response and error)
 * 2. Do not capture error or response
 * 3. Do not enable tracer
 * 4. Disable capture response via decorator options
 * Each stack must use a unique `serviceName` as it's used to for retrieving the trace.
 * Using the same one will result in traces from different test cases mixing up.
 */
describe('Tracer E2E tests, all features with decorator instantiation', () => {
  const testStack = new TestStack({
    stackNameProps: {
      stackNamePrefix: RESOURCE_NAME_PREFIX,
      testName: 'AllFeatures-Decorator',
    },
  });

  // Location of the lambda function code
  const lambdaFunctionCodeFilePath = join(
    __dirname,
    'allFeatures.decorator.test.functionCode.ts'
  );
  const startTime = new Date();

  /**
   * Table used by all functions to make an SDK call
   */
  const testTable = new TestDynamodbTable(
    testStack,
    {},
    {
      nameSuffix: 'TestTable',
    }
  );

  /**
   * Function #1 is with all flags enabled.
   */
  let fnNameAllFlagsEnabled: string;
  const fnAllFlagsEnabled = new TracerTestNodejsFunction(
    testStack,
    {
      entry: lambdaFunctionCodeFilePath,
      environment: {
        TEST_TABLE_NAME: testTable.tableName,
      },
    },
    {
      nameSuffix: 'AllFlagsOn',
      outputFormat: 'ESM',
    }
  );
  testTable.grantWriteData(fnAllFlagsEnabled);

  /**
   * Function #2 doesn't capture error or response
   */
  let fnNameNoCaptureErrorOrResponse: string;
  const fnNoCaptureErrorOrResponse = new TracerTestNodejsFunction(
    testStack,
    {
      entry: lambdaFunctionCodeFilePath,
      environment: {
        TEST_TABLE_NAME: testTable.tableName,
        POWERTOOLS_TRACER_CAPTURE_RESPONSE: 'false',
        POWERTOOLS_TRACER_CAPTURE_ERROR: 'false',
      },
    },
    {
      nameSuffix: 'NoCaptureErrOrResp',
      outputFormat: 'ESM',
    }
  );
  testTable.grantWriteData(fnNoCaptureErrorOrResponse);

  /**
   * Function #3 disables tracer
   */
  let fnNameTracerDisabled: string;
  const fnTracerDisabled = new TracerTestNodejsFunction(
    testStack,
    {
      entry: lambdaFunctionCodeFilePath,
      environment: {
        TEST_TABLE_NAME: testTable.tableName,
        POWERTOOLS_TRACE_ENABLED: 'false',
      },
    },
    {
      nameSuffix: 'TracerDisabled',
      outputFormat: 'ESM',
    }
  );
  testTable.grantWriteData(fnTracerDisabled);

  /**
   * Function #4 disables capture response via decorator options
   */
  let fnNameCaptureResponseOff: string;
  const fnCaptureResponseOff = new TracerTestNodejsFunction(
    testStack,
    {
      entry: lambdaFunctionCodeFilePath,
      handler: 'handlerWithCaptureResponseFalse',
      environment: {
        TEST_TABLE_NAME: testTable.tableName,
      },
    },
    {
      nameSuffix: 'CaptureResponseOff',
      outputFormat: 'ESM',
    }
  );
  testTable.grantWriteData(fnCaptureResponseOff);

  const invocationCount = 3;

  beforeAll(async () => {
    // Deploy the stack
    await testStack.deploy();

    // Get the actual function names from the stack outputs
    fnNameAllFlagsEnabled = testStack.findAndGetStackOutputValue('AllFlagsOn');
    fnNameNoCaptureErrorOrResponse =
      testStack.findAndGetStackOutputValue('NoCaptureErrOrResp');
    fnNameTracerDisabled =
      testStack.findAndGetStackOutputValue('TracerDisabled');
    fnNameCaptureResponseOff =
      testStack.findAndGetStackOutputValue('CaptureResponseOff');

    // Invoke all functions
    await Promise.all([
      invokeAllTestCases(fnNameAllFlagsEnabled, invocationCount),
      invokeAllTestCases(fnNameNoCaptureErrorOrResponse, invocationCount),
      invokeAllTestCases(fnNameTracerDisabled, invocationCount),
      invokeAllTestCases(fnNameCaptureResponseOff, invocationCount),
    ]);
  }, SETUP_TIMEOUT);

  afterAll(async () => {
    if (!process.env.DISABLE_TEARDOWN) {
      await testStack.destroy();
    }
  }, TEARDOWN_TIMEOUT);

  it(
    'should generate all custom traces with correct subsegments, annotations, and metadata',
    async () => {
      // Prepare
      const {
        EXPECTED_CUSTOM_ERROR_MESSAGE: expectedCustomErrorMessage,
        EXPECTED_CUSTOM_ANNOTATION_KEY: expectedCustomAnnotationKey,
        EXPECTED_CUSTOM_ANNOTATION_VALUE: expectedCustomAnnotationValue,
        EXPECTED_CUSTOM_METADATA_KEY: expectedCustomMetadataKey,
        EXPECTED_CUSTOM_METADATA_VALUE: expectedCustomMetadataValue,
        EXPECTED_CUSTOM_RESPONSE_VALUE: expectedCustomResponseValue,
      } = commonEnvironmentVars;
      const serviceName = 'AllFlagsOn';

      const mainSubsegments = await getTraces({
        startTime,
        resourceName: fnNameAllFlagsEnabled,
        expectedTracesCount: invocationCount,
        /**
         * The trace should have 4 segments:
         * 1. Lambda Context (AWS::Lambda)
         * 2. Lambda Function (AWS::Lambda::Function)
         * 4. DynamoDB (AWS::DynamoDB)
         * 4. Remote call (docs.powertools.aws.dev)
         */
        expectedSegmentsCount: 4,
      });

      // Assess
      for (let i = 0; i < invocationCount; i++) {
        const isColdStart = i === 0; // First invocation is a cold start
        const shouldThrowAnError = i === invocationCount - 1; // Last invocation should throw - we are testing error capture
        const mainSubsegment = mainSubsegments[i];
        const { subsegments, annotations, metadata } = mainSubsegment;

        // Check the main segment name
        expect(mainSubsegment.name).toBe('## index.handler');

        // Check the subsegments
        expect(subsegments.size).toBe(3);
        expect(subsegments.has('DynamoDB')).toBe(true);
        expect(subsegments.has('docs.powertools.aws.dev')).toBe(true);
        expect(subsegments.has('### myMethod')).toBe(true);

        // Check the annotations
        if (!annotations) {
          throw new Error('No annotations found on the main segment');
        }
        expect(annotations.ColdStart).toEqual(isColdStart);
        expect(annotations.Service).toEqual(serviceName);
        expect(annotations[expectedCustomAnnotationKey]).toEqual(
          expectedCustomAnnotationValue
        );

        // Check the metadata
        if (!metadata) {
          throw new Error('No metadata found on the main segment');
        }
        expect(metadata[serviceName][expectedCustomMetadataKey]).toEqual(
          expectedCustomMetadataValue
        );

        // Check the error recording (only on invocations that should throw)
        if (shouldThrowAnError) {
          expect(mainSubsegment.fault).toBe(true);
          expect(Object.hasOwn(mainSubsegment, 'cause')).toBe(true);
          expect(mainSubsegment.cause?.exceptions[0].message).toBe(
            expectedCustomErrorMessage
          );
          // Check the response in the metadata (only on invocations that DON'T throw)
        } else {
          expect(metadata[serviceName]['index.handler response']).toEqual(
            expectedCustomResponseValue
          );
        }
      }
    },
    TEST_CASE_TIMEOUT
  );

  it(
    'should not capture error nor response when the flags are false',
    async () => {
      const mainSubsegments = await getTraces({
        startTime,
        resourceName: fnNameNoCaptureErrorOrResponse,
        expectedTracesCount: invocationCount,
        /**
         * Expect the trace to have 4 segments:
         * 1. Lambda Context (AWS::Lambda)
         * 2. Lambda Function (AWS::Lambda::Function)
         * 3. DynamoDB (AWS::DynamoDB)
         * 4. Remote call (docs.powertools.aws.dev)
         */
        expectedSegmentsCount: 4,
      });

      // Assess
      const mainSubsegment = mainSubsegments[2]; // Only the last invocation should throw
      // Assert that the subsegment has the expected fault
      expect(mainSubsegment.error).toBe(true);
      // Assert that no error was captured on the subsegment
      expect(Object.hasOwn(mainSubsegment, 'cause')).toBe(false);
    },
    TEST_CASE_TIMEOUT
  );

  it(
    'should not capture any custom traces when disabled',
    async () => {
      const lambdaFunctionSegments = await getTracesWithoutMainSubsegments({
        startTime,
        resourceName: fnNameTracerDisabled,
        expectedTracesCount: invocationCount,
        /**
         * Expect the trace to have 2 segments:
         * 1. Lambda Context (AWS::Lambda)
         * 2. Lambda Function (AWS::Lambda::Function)
         */
        expectedSegmentsCount: 2,
      });

      // Assess
      for (let i = 0; i < invocationCount; i++) {
        const shouldThrowAnError = i === invocationCount - 1; // Last invocation should throw - we are testing error capture
        const lambdaFunctionSegment = lambdaFunctionSegments[i];
        const { subsegments } = lambdaFunctionSegment;

        expect(subsegments.has('## index.handler')).toBe(false);

        if (shouldThrowAnError) {
          expect(lambdaFunctionSegment.error).toBe(true);
        }
      }
    },
    TEST_CASE_TIMEOUT
  );

  it(
    'should not capture response when captureResponse is set to false',
    async () => {
      const mainSubsegments = await getTraces({
        startTime,
        resourceName: fnNameCaptureResponseOff,
        expectedTracesCount: invocationCount,
        /**
         * Expect the trace to have 4 segments:
         * 1. Lambda Context (AWS::Lambda)
         * 2. Lambda Function (AWS::Lambda::Function)
         * 3. DynamoDB (AWS::DynamoDB)
         * 4. Remote call (docs.powertools.aws.dev)
         */
        expectedSegmentsCount: 4,
      });

      // Assess
      for (let i = 0; i < invocationCount; i++) {
        const mainSubsegment = mainSubsegments[i];
        const { subsegments } = mainSubsegment;

        expect(mainSubsegment.name).toBe(
          '## index.handlerWithCaptureResponseFalse'
        );
        const customSubsegment = subsegments.get('### myMethod');
        expect(customSubsegment).toBeDefined();

        // No metadata because capturing the response was disabled and that's
        // the only metadata that could be in the subsegment for the test.
        expect(customSubsegment).not.toHaveProperty('metadata');
      }
    },
    TEST_CASE_TIMEOUT
  );
});

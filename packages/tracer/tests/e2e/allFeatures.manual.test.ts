/**
 * Test tracer manual mode
 *
 * @group e2e/tracer/manual
 */
import { join } from 'node:path';
import { TestStack } from '@aws-lambda-powertools/testing-utils';
import { TestDynamodbTable } from '@aws-lambda-powertools/testing-utils/resources/dynamodb';
import { getTraces } from '@aws-lambda-powertools/testing-utils/utils/xray-traces';
import { invokeAllTestCases } from '../helpers/invokeAllTests.js';
import { TracerTestNodejsFunction } from '../helpers/resources.js';
import {
  RESOURCE_NAME_PREFIX,
  SETUP_TIMEOUT,
  TEARDOWN_TIMEOUT,
  TEST_CASE_TIMEOUT,
  commonEnvironmentVars,
} from './constants.js';

describe('Tracer E2E tests, all features with manual instantiation', () => {
  const testStack = new TestStack({
    stackNameProps: {
      stackNamePrefix: RESOURCE_NAME_PREFIX,
      testName: 'AllFeatures-Manual',
    },
  });

  // Location of the lambda function code
  const lambdaFunctionCodeFilePath = join(
    __dirname,
    'allFeatures.manual.test.functionCode.ts'
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
      nameSuffix: 'AllFlagsManual',
    }
  );
  testTable.grantWriteData(fnAllFlagsEnabled);

  const invocationCount = 3;

  beforeAll(async () => {
    // Deploy the stack
    await testStack.deploy();

    // Get the actual function names from the stack outputs
    fnNameAllFlagsEnabled =
      testStack.findAndGetStackOutputValue('AllFlagsManual');

    // Invoke all test cases
    await invokeAllTestCases(fnNameAllFlagsEnabled, invocationCount);
  }, SETUP_TIMEOUT);

  afterAll(async () => {
    if (!process.env.DISABLE_TEARDOWN) {
      await testStack.destroy();
    }
  }, TEARDOWN_TIMEOUT);

  it(
    'should generate all custom traces with correct subsegments, annotations, and metadata',
    async () => {
      const {
        EXPECTED_CUSTOM_ERROR_MESSAGE: expectedCustomErrorMessage,
        EXPECTED_CUSTOM_ANNOTATION_KEY: expectedCustomAnnotationKey,
        EXPECTED_CUSTOM_ANNOTATION_VALUE: expectedCustomAnnotationValue,
        EXPECTED_CUSTOM_METADATA_KEY: expectedCustomMetadataKey,
        EXPECTED_CUSTOM_METADATA_VALUE: expectedCustomMetadataValue,
        EXPECTED_CUSTOM_RESPONSE_VALUE: expectedCustomResponseValue,
      } = commonEnvironmentVars;
      const serviceName = 'AllFlagsManual';

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
        expect(subsegments.size).toBe(2);
        expect(subsegments.has('DynamoDB')).toBe(true);
        expect(subsegments.has('docs.powertools.aws.dev')).toBe(true);

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
});

/**
 * Test tracer manual mode
 *
 * @group e2e/tracer/manual
 */
import { TestStack } from '@aws-lambda-powertools/testing-utils';
import { TestDynamodbTable } from '@aws-lambda-powertools/testing-utils/resources/dynamodb';
import { join } from 'path';
import { TracerTestNodejsFunction } from '../helpers/resources';
import {
  assertAnnotation,
  assertErrorAndFault,
} from '../helpers/traceAssertions';
import {
  getFirstSubsegment,
  getInvocationSubsegment,
  getTraces,
  invokeAllTestCases,
  splitSegmentsByName,
} from '../helpers/tracesUtils';
import type { ParsedTrace } from '../helpers/traceUtils.types';
import {
  commonEnvironmentVars,
  RESOURCE_NAME_PREFIX,
  SETUP_TIMEOUT,
  TEARDOWN_TIMEOUT,
  TEST_CASE_TIMEOUT,
} from './constants';

describe(`Tracer E2E tests, all features with manual instantiation`, () => {
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
      nameSuffix: 'AllFlagsOn',
    }
  );
  testTable.grantWriteData(fnAllFlagsEnabled);

  const invocationCount = 3;
  let sortedTraces: ParsedTrace[];

  beforeAll(async () => {
    // Deploy the stack
    await testStack.deploy();

    // Get the actual function names from the stack outputs
    fnNameAllFlagsEnabled = testStack.findAndGetStackOutputValue('AllFlagsOn');

    // Invoke all test cases
    await invokeAllTestCases(fnNameAllFlagsEnabled, invocationCount);

    /**
     * Expect the trace to have 4 segments:
     * 1. Lambda Context (AWS::Lambda)
     * 2. Lambda Function (AWS::Lambda::Function)
     * 3. DynamoDB (AWS::DynamoDB)
     * 4. Remote call (docs.powertools.aws.dev)
     */
    sortedTraces = await getTraces({
      startTime,
      resourceName: fnNameAllFlagsEnabled,
      expectedTracesCount: invocationCount,
      expectedSegmentsCount: 4,
    });
  }, SETUP_TIMEOUT);

  afterAll(async () => {
    if (!process.env.DISABLE_TEARDOWN) {
      await testStack.destroy();
    }
  }, TEARDOWN_TIMEOUT);

  it(
    'should generate all custom traces',
    async () => {
      const { EXPECTED_CUSTOM_ERROR_MESSAGE: expectedCustomErrorMessage } =
        commonEnvironmentVars;

      // Assess
      for (let i = 0; i < invocationCount; i++) {
        const trace = sortedTraces[i];
        const invocationSubsegment = getInvocationSubsegment(trace);
        /**
         * Invocation subsegment should have a subsegment '## index.handler' (default behavior for Tracer)
         * '## index.handler' subsegment should have 2 subsegments
         * 1. DynamoDB (PutItem on the table)
         * 2. docs.powertools.aws.dev (Remote call)
         */
        const handlerSubsegment = getFirstSubsegment(invocationSubsegment);
        expect(handlerSubsegment.name).toBe('## index.handler');
        expect(handlerSubsegment?.subsegments).toHaveLength(2);

        if (!handlerSubsegment.subsegments) {
          fail('"## index.handler" subsegment should have subsegments');
        }
        const subsegments = splitSegmentsByName(handlerSubsegment.subsegments, [
          'DynamoDB',
          'docs.powertools.aws.dev',
        ]);
        expect(subsegments.get('DynamoDB')?.length).toBe(1);
        expect(subsegments.get('docs.powertools.aws.dev')?.length).toBe(1);
        expect(subsegments.get('other')?.length).toBe(0);

        const shouldThrowAnError = i === invocationCount - 1;
        if (shouldThrowAnError) {
          assertErrorAndFault(invocationSubsegment, expectedCustomErrorMessage);
        }
      }
    },
    TEST_CASE_TIMEOUT
  );

  it(
    'should have correct annotations and metadata',
    async () => {
      const {
        EXPECTED_CUSTOM_ANNOTATION_KEY: expectedCustomAnnotationKey,
        EXPECTED_CUSTOM_ANNOTATION_VALUE: expectedCustomAnnotationValue,
        EXPECTED_CUSTOM_METADATA_KEY: expectedCustomMetadataKey,
        EXPECTED_CUSTOM_METADATA_VALUE: expectedCustomMetadataValue,
        EXPECTED_CUSTOM_RESPONSE_VALUE: expectedCustomResponseValue,
      } = commonEnvironmentVars;

      for (let i = 0; i < invocationCount; i++) {
        const trace = sortedTraces[i];
        const invocationSubsegment = getInvocationSubsegment(trace);
        const handlerSubsegment = getFirstSubsegment(invocationSubsegment);
        const { annotations, metadata } = handlerSubsegment;

        const isColdStart = i === 0;
        assertAnnotation({
          annotations,
          isColdStart,
          expectedServiceName: 'AllFlagsOn',
          expectedCustomAnnotationKey,
          expectedCustomAnnotationValue,
        });

        if (!metadata) {
          fail('metadata is missing');
        }
        expect(metadata['AllFlagsOn'][expectedCustomMetadataKey]).toEqual(
          expectedCustomMetadataValue
        );

        const shouldThrowAnError = i === invocationCount - 1;
        if (!shouldThrowAnError) {
          // Assert that the metadata object contains the response
          expect(metadata['AllFlagsOn']['index.handler response']).toEqual(
            expectedCustomResponseValue
          );
        }
      }
    },
    TEST_CASE_TIMEOUT
  );
});

/**
 * Test tracer in decorator setup
 *
 * @group e2e/tracer/decorator-async-handler
 */
import { TestStack } from '@aws-lambda-powertools/testing-utils';
import { TestDynamodbTable } from '@aws-lambda-powertools/testing-utils/resources/dynamodb';
import { join } from 'node:path';
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
import {
  commonEnvironmentVars,
  RESOURCE_NAME_PREFIX,
  SETUP_TIMEOUT,
  TEARDOWN_TIMEOUT,
  TEST_CASE_TIMEOUT,
} from './constants';

describe(`Tracer E2E tests, async handler with decorator instantiation`, () => {
  const testStack = new TestStack({
    stackNameProps: {
      stackNamePrefix: RESOURCE_NAME_PREFIX,
      testName: 'AllFeatures-AsyncDecorator',
    },
  });

  // Location of the lambda function code
  const lambdaFunctionCodeFilePath = join(
    __dirname,
    'asyncHandler.decorator.test.functionCode.ts'
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
    }
  );
  testTable.grantWriteData(fnAllFlagsEnabled);

  /**
   * Function #2 sets a custom subsegment name in the decorated method
   */
  let fnNameCustomSubsegment: string;
  const fnCustomSubsegmentName = new TracerTestNodejsFunction(
    testStack,
    {
      entry: lambdaFunctionCodeFilePath,
      handler: 'handlerWithCustomSubsegmentNameInMethod',
      environment: {
        TEST_TABLE_NAME: testTable.tableName,
      },
    },
    {
      nameSuffix: 'CustomSubsegmentName',
    }
  );
  testTable.grantWriteData(fnCustomSubsegmentName);

  const invocationsCount = 3;

  beforeAll(async () => {
    // Deploy the stack
    await testStack.deploy();

    // Get the actual function names from the stack outputs
    fnNameAllFlagsEnabled = testStack.findAndGetStackOutputValue('AllFlagsOn');
    fnNameCustomSubsegment = testStack.findAndGetStackOutputValue(
      'CustomSubsegmentName'
    );

    // Act
    await Promise.all([
      invokeAllTestCases(fnNameAllFlagsEnabled, invocationsCount),
      invokeAllTestCases(fnNameCustomSubsegment, invocationsCount),
    ]);
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

      /**
       * Expect the trace to have 4 segments:
       * 1. Lambda Context (AWS::Lambda)
       * 2. Lambda Function (AWS::Lambda::Function)
       * 3. DynamoDB Table (AWS::DynamoDB::Table)
       * 4. Remote call (docs.powertools.aws.dev)
       */
      const tracesWhenAllFlagsEnabled = await getTraces({
        startTime,
        resourceName: fnNameAllFlagsEnabled,
        expectedTracesCount: invocationsCount,
        expectedSegmentsCount: 4,
      });

      // Assess
      for (let i = 0; i < invocationsCount; i++) {
        const trace = tracesWhenAllFlagsEnabled[i];
        const invocationSubsegment = getInvocationSubsegment(trace);

        /**
         * Invocation subsegment should have a subsegment '## index.handler' (default behavior for Tracer)
         * '## index.handler' subsegment should have 3 subsegments
         * 1. DynamoDB (PutItem on the table)
         * 2. docs.powertools.aws.dev (Remote call)
         * 3. '### myMethod' (method decorator)
         */
        const handlerSubsegment = getFirstSubsegment(invocationSubsegment);
        expect(handlerSubsegment.name).toBe('## index.handler');
        expect(handlerSubsegment?.subsegments).toHaveLength(3);

        if (!handlerSubsegment.subsegments) {
          fail('"## index.handler" subsegment should have subsegments');
        }
        const subsegments = splitSegmentsByName(handlerSubsegment.subsegments, [
          'DynamoDB',
          'docs.powertools.aws.dev',
          '### myMethod',
        ]);
        expect(subsegments.get('DynamoDB')?.length).toBe(1);
        expect(subsegments.get('docs.powertools.aws.dev')?.length).toBe(1);
        expect(subsegments.get('### myMethod')?.length).toBe(1);
        expect(subsegments.get('other')?.length).toBe(0);

        const shouldThrowAnError = i === invocationsCount - 1;
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

      const traces = await getTraces({
        startTime,
        resourceName: fnNameAllFlagsEnabled,
        expectedTracesCount: invocationsCount,
        expectedSegmentsCount: 4,
      });

      for (let i = 0; i < invocationsCount; i++) {
        const trace = traces[i];
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

        const shouldThrowAnError = i === invocationsCount - 1;
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

  it(
    'should have a custom name as the subsegment name for the decorated method',
    async () => {
      const {
        EXPECTED_CUSTOM_ERROR_MESSAGE: expectedCustomErrorMessage,
        EXPECTED_CUSTOM_SUBSEGMENT_NAME: expectedCustomSubSegmentName,
      } = commonEnvironmentVars;

      /**
       * Expect the trace to have 4 segments:
       * 1. Lambda Context (AWS::Lambda)
       * 2. Lambda Function (AWS::Lambda::Function)
       * 3. DynamoDB Table (AWS::DynamoDB::Table)
       * 4. Remote call (docs.powertools.aws.dev)
       */
      const tracesWhenCustomSubsegmentNameInMethod = await getTraces({
        startTime,
        resourceName: fnNameCustomSubsegment,
        expectedTracesCount: invocationsCount,
        expectedSegmentsCount: 4,
      });

      // Assess
      for (let i = 0; i < invocationsCount; i++) {
        const trace = tracesWhenCustomSubsegmentNameInMethod[i];
        const invocationSubsegment = getInvocationSubsegment(trace);

        /**
         * Invocation subsegment should have a subsegment '## index.handler' (default behavior for Tracer)
         * '## index.handler' subsegment should have 3 subsegments
         * 1. DynamoDB (PutItem on the table)
         * 2. docs.powertools.aws.dev (Remote call)
         * 3. '### mySubsegment' (method decorator with custom name)
         */
        const handlerSubsegment = getFirstSubsegment(invocationSubsegment);
        expect(handlerSubsegment.name).toBe(
          '## index.handlerWithCustomSubsegmentNameInMethod'
        );
        expect(handlerSubsegment?.subsegments).toHaveLength(3);

        if (!handlerSubsegment.subsegments) {
          fail('"## index.handler" subsegment should have subsegments');
        }
        const subsegments = splitSegmentsByName(handlerSubsegment.subsegments, [
          'DynamoDB',
          'docs.powertools.aws.dev',
          expectedCustomSubSegmentName,
        ]);
        expect(subsegments.get('DynamoDB')?.length).toBe(1);
        expect(subsegments.get('docs.powertools.aws.dev')?.length).toBe(1);
        expect(subsegments.get(expectedCustomSubSegmentName)?.length).toBe(1);
        expect(subsegments.get('other')?.length).toBe(0);

        const shouldThrowAnError = i === invocationsCount - 1;
        if (shouldThrowAnError) {
          assertErrorAndFault(invocationSubsegment, expectedCustomErrorMessage);
        }
      }
    },
    TEST_CASE_TIMEOUT
  );
});

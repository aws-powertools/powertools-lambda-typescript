/**
 * Test tracer in decorator setup
 *
 * @group e2e/tracer/decorator-async-handler
 */
import {
  concatenateResourceName,
  defaultRuntime,
  generateTestUniqueName,
  isValidRuntimeKey,
  TestNodejsFunction,
  TestStack,
  TEST_RUNTIMES,
} from '@aws-lambda-powertools/testing-utils';
import { STSClient } from '@aws-sdk/client-sts';
import { XRayClient } from '@aws-sdk/client-xray';
import { RemovalPolicy } from 'aws-cdk-lib';
import { AttributeType, BillingMode, Table } from 'aws-cdk-lib/aws-dynamodb';
import { join } from 'node:path';
import {
  assertAnnotation,
  assertErrorAndFault,
} from '../helpers/traceAssertions';
import {
  getFirstSubsegment,
  getFunctionArn,
  getInvocationSubsegment,
  getTraces,
  invokeAllTestCases,
  splitSegmentsByName,
} from '../helpers/tracesUtils';
import {
  commonEnvironmentVariables,
  expectedCustomAnnotationKey,
  expectedCustomAnnotationValue,
  expectedCustomErrorMessage,
  expectedCustomMetadataKey,
  expectedCustomMetadataValue,
  expectedCustomResponseValue,
  expectedCustomSubSegmentName,
  RESOURCE_NAME_PREFIX,
  SETUP_TIMEOUT,
  TEARDOWN_TIMEOUT,
  TEST_CASE_TIMEOUT,
} from './constants';

describe(`Tracer E2E tests, async handler with decorator instantiation`, () => {
  const runtime: string = process.env.RUNTIME || defaultRuntime;

  if (!isValidRuntimeKey(runtime)) {
    throw new Error(`Invalid runtime key value: ${runtime}`);
  }

  const testName = generateTestUniqueName({
    testPrefix: RESOURCE_NAME_PREFIX,
    runtime,
    testName: 'Async-Decorator',
  });
  const testStack = new TestStack(testName);

  // Location of the lambda function code
  const lambdaFunctionCodeFile = join(
    __dirname,
    'asyncHandler.decorator.test.functionCode.ts'
  );
  const startTime = new Date();

  /**
   * Function #1 is with all flags enabled.
   */
  const fnNameAllFlagsEnabled = concatenateResourceName({
    testName,
    resourceName: 'AllFlagsOn',
  });

  /**
   * Function #2 sets a custom subsegment name in the decorated method
   */
  const fnNameCustomSubsegment = concatenateResourceName({
    testName,
    resourceName: 'CustomSubsegmentName',
  });

  /**
   * Table used by all functions to make an SDK call
   */
  const ddbTableName = concatenateResourceName({
    testName,
    resourceName: 'TestTable',
  });

  const xrayClient = new XRayClient({});
  const stsClient = new STSClient({});
  const invocations = 3;

  beforeAll(async () => {
    // Prepare
    const ddbTable = new Table(testStack.stack, 'Table', {
      tableName: ddbTableName,
      partitionKey: {
        name: 'id',
        type: AttributeType.STRING,
      },
      billingMode: BillingMode.PAY_PER_REQUEST,
      removalPolicy: RemovalPolicy.DESTROY,
    });

    const fnWithAllFlagsEnabled = new TestNodejsFunction(
      testStack.stack,
      fnNameAllFlagsEnabled,
      {
        functionName: fnNameAllFlagsEnabled,
        entry: lambdaFunctionCodeFile,
        runtime: TEST_RUNTIMES[runtime],
        environment: {
          TEST_TABLE_NAME: ddbTableName,
          POWERTOOLS_TRACER_CAPTURE_RESPONSE: 'true',
          POWERTOOLS_TRACER_CAPTURE_ERROR: 'true',
          POWERTOOLS_TRACE_ENABLED: 'true',
          EXPECTED_SERVICE_NAME: fnNameAllFlagsEnabled,
          ...commonEnvironmentVariables,
        },
      }
    );
    ddbTable.grantWriteData(fnWithAllFlagsEnabled);

    const fnWithCustomSubsegmentName = new TestNodejsFunction(
      testStack.stack,
      fnNameCustomSubsegment,
      {
        functionName: fnNameCustomSubsegment,
        entry: lambdaFunctionCodeFile,
        runtime: TEST_RUNTIMES[runtime],
        handler: 'handlerWithCustomSubsegmentNameInMethod',
        environment: {
          TEST_TABLE_NAME: ddbTableName,
          POWERTOOLS_TRACER_CAPTURE_RESPONSE: 'true',
          POWERTOOLS_TRACER_CAPTURE_ERROR: 'true',
          POWERTOOLS_TRACE_ENABLED: 'true',
          EXPECTED_SERVICE_NAME: fnNameCustomSubsegment,
          EXPECTED_CUSTOM_SUBSEGMENT_NAME: expectedCustomSubSegmentName,
          ...commonEnvironmentVariables,
        },
      }
    );
    ddbTable.grantWriteData(fnWithCustomSubsegmentName);

    await testStack.deploy();

    // Act
    await Promise.all([
      invokeAllTestCases(fnNameAllFlagsEnabled),
      invokeAllTestCases(fnNameCustomSubsegment),
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
      const tracesWhenAllFlagsEnabled = await getTraces(
        xrayClient,
        startTime,
        await getFunctionArn(stsClient, fnNameAllFlagsEnabled),
        invocations,
        4
      );

      expect(tracesWhenAllFlagsEnabled.length).toBe(invocations);

      // Assess
      for (let i = 0; i < invocations; i++) {
        const trace = tracesWhenAllFlagsEnabled[i];

        /**
         * Expect the trace to have 4 segments:
         * 1. Lambda Context (AWS::Lambda)
         * 2. Lambda Function (AWS::Lambda::Function)
         * 3. DynamoDB Table (AWS::DynamoDB::Table)
         * 4. Remote call (docs.powertools.aws.dev)
         */
        expect(trace.Segments.length).toBe(4);
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

        const shouldThrowAnError = i === invocations - 1;
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
      const traces = await getTraces(
        xrayClient,
        startTime,
        await getFunctionArn(stsClient, fnNameAllFlagsEnabled),
        invocations,
        4
      );

      for (let i = 0; i < invocations; i++) {
        const trace = traces[i];
        const invocationSubsegment = getInvocationSubsegment(trace);
        const handlerSubsegment = getFirstSubsegment(invocationSubsegment);
        const { annotations, metadata } = handlerSubsegment;

        const isColdStart = i === 0;
        assertAnnotation({
          annotations,
          isColdStart,
          expectedServiceName: fnNameAllFlagsEnabled,
          expectedCustomAnnotationKey,
          expectedCustomAnnotationValue,
        });

        if (!metadata) {
          fail('metadata is missing');
        }
        expect(
          metadata[fnNameAllFlagsEnabled][expectedCustomMetadataKey]
        ).toEqual(expectedCustomMetadataValue);

        const shouldThrowAnError = i === invocations - 1;
        if (!shouldThrowAnError) {
          // Assert that the metadata object contains the response
          expect(
            metadata[fnNameAllFlagsEnabled]['index.handler response']
          ).toEqual(expectedCustomResponseValue);
        }
      }
    },
    TEST_CASE_TIMEOUT
  );

  it(
    'should have a custom name as the subsegment name for the decorated method',
    async () => {
      const tracesWhenCustomSubsegmentNameInMethod = await getTraces(
        xrayClient,
        startTime,
        await getFunctionArn(stsClient, fnNameCustomSubsegment),
        invocations,
        4
      );

      expect(tracesWhenCustomSubsegmentNameInMethod.length).toBe(invocations);

      // Assess
      for (let i = 0; i < invocations; i++) {
        const trace = tracesWhenCustomSubsegmentNameInMethod[i];

        /**
         * Expect the trace to have 4 segments:
         * 1. Lambda Context (AWS::Lambda)
         * 2. Lambda Function (AWS::Lambda::Function)
         * 3. DynamoDB Table (AWS::DynamoDB::Table)
         * 4. Remote call (docs.powertools.aws.dev)
         */
        expect(trace.Segments.length).toBe(4);
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

        const shouldThrowAnError = i === invocations - 1;
        if (shouldThrowAnError) {
          assertErrorAndFault(invocationSubsegment, expectedCustomErrorMessage);
        }
      }
    },
    TEST_CASE_TIMEOUT
  );
});

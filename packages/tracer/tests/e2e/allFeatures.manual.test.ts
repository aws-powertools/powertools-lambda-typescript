/**
 * Test tracer manual mode
 *
 * @group e2e/tracer/manual
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
import { join } from 'path';
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
import type { ParsedTrace } from '../helpers/traceUtils.types';
import {
  commonEnvironmentVariables,
  expectedCustomAnnotationKey,
  expectedCustomAnnotationValue,
  expectedCustomErrorMessage,
  expectedCustomMetadataKey,
  expectedCustomMetadataValue,
  expectedCustomResponseValue,
  RESOURCE_NAME_PREFIX,
  SETUP_TIMEOUT,
  TEARDOWN_TIMEOUT,
  TEST_CASE_TIMEOUT,
} from './constants';

describe(`Tracer E2E tests, all features with manual instantiation`, () => {
  const runtime: string = process.env.RUNTIME || defaultRuntime;

  if (!isValidRuntimeKey(runtime)) {
    throw new Error(`Invalid runtime key value: ${runtime}`);
  }

  const testName = generateTestUniqueName({
    testPrefix: RESOURCE_NAME_PREFIX,
    runtime,
    testName: 'AllFeatures-Decorator',
  });
  const testStack = new TestStack(testName);

  // Location of the lambda function code
  const lambdaFunctionCodeFile = join(
    __dirname,
    'allFeatures.manual.test.functionCode.ts'
  );
  const startTime = new Date();

  const fnNameAllFlagsEnabled = concatenateResourceName({
    testName,
    resourceName: 'AllFlagsOn',
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
  let sortedTraces: ParsedTrace[];

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

    await testStack.deploy();

    // Act
    await invokeAllTestCases(fnNameAllFlagsEnabled);

    // Retrieve traces from X-Ray for assertion
    const lambdaFunctionArn = await getFunctionArn(
      stsClient,
      fnNameAllFlagsEnabled
    );
    sortedTraces = await getTraces(
      xrayClient,
      startTime,
      lambdaFunctionArn,
      invocations,
      4
    );
  }, SETUP_TIMEOUT);

  afterAll(async () => {
    if (!process.env.DISABLE_TEARDOWN) {
      await testStack.destroy();
    }
  }, TEARDOWN_TIMEOUT);

  it(
    'should generate all custom traces',
    async () => {
      expect(sortedTraces.length).toBe(invocations);

      // Assess
      for (let i = 0; i < invocations; i++) {
        const trace = sortedTraces[i];

        /**
         * Expect the trace to have 4 segments:
         * 1. Lambda Context (AWS::Lambda)
         * 2. Lambda Function (AWS::Lambda::Function)
         * 3. DynamoDB (AWS::DynamoDB)
         * 4. Remote call (docs.powertools.aws.dev)
         */
        expect(trace.Segments.length).toBe(4);
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
      for (let i = 0; i < invocations; i++) {
        const trace = sortedTraces[i];
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
});

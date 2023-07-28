/**
 * Test tracer in middy setup
 *
 * @group e2e/tracer/middy
 */

import path from 'path';
import { AttributeType, BillingMode, Table } from 'aws-cdk-lib/aws-dynamodb';
import { RemovalPolicy } from 'aws-cdk-lib';
import { XRayClient } from '@aws-sdk/client-xray';
import { STSClient } from '@aws-sdk/client-sts';
import { v4 } from 'uuid';
import {
  TestStack,
  defaultRuntime,
} from '@aws-lambda-powertools/testing-utils';
import {
  createTracerTestFunction,
  getFirstSubsegment,
  getFunctionArn,
  getInvocationSubsegment,
  getTraces,
  invokeAllTestCases,
  splitSegmentsByName,
} from '../helpers/tracesUtils';
import {
  generateUniqueName,
  isValidRuntimeKey,
} from '../../../commons/tests/utils/e2eUtils';
import {
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
import {
  assertAnnotation,
  assertErrorAndFault,
} from '../helpers/traceAssertions';

const runtime: string = process.env.RUNTIME || defaultRuntime;

if (!isValidRuntimeKey(runtime)) {
  throw new Error(`Invalid runtime key value: ${runtime}`);
}

/**
 * We will create a stack with 3 Lambda functions:
 * 1. With all flags enabled (capture both response and error)
 * 2. Do not capture error or response
 * 3. Do not enable tracer
 * Each stack must use a unique `serviceName` as it's used to for retrieving the trace.
 * Using the same one will result in traces from different test cases mixing up.
 */
const stackName = generateUniqueName(
  RESOURCE_NAME_PREFIX,
  v4(),
  runtime,
  'AllFeatures-Middy'
);
const lambdaFunctionCodeFile = 'allFeatures.middy.test.functionCode.ts';
let startTime: Date;

/**
 * Function #1 is with all flags enabled.
 */
const uuidFunction1 = v4();
const functionNameWithAllFlagsEnabled = generateUniqueName(
  RESOURCE_NAME_PREFIX,
  uuidFunction1,
  runtime,
  'AllFeatures-Middy-AllFlagsEnabled'
);
const serviceNameWithAllFlagsEnabled = functionNameWithAllFlagsEnabled;

/**
 * Function #2 doesn't capture error or response
 */
const uuidFunction2 = v4();
const functionNameWithNoCaptureErrorOrResponse = generateUniqueName(
  RESOURCE_NAME_PREFIX,
  uuidFunction2,
  runtime,
  'AllFeatures-Middy-NoCaptureErrorOrResponse'
);
const serviceNameWithNoCaptureErrorOrResponse =
  functionNameWithNoCaptureErrorOrResponse;
/**
 * Function #3 disables tracer
 */
const uuidFunction3 = v4();
const functionNameWithTracerDisabled = generateUniqueName(
  RESOURCE_NAME_PREFIX,
  uuidFunction3,
  runtime,
  'AllFeatures-Middy-TracerDisabled'
);
const serviceNameWithTracerDisabled = functionNameWithNoCaptureErrorOrResponse;

/**
 * Function #4 doesn't capture response
 */
const uuidFunction4 = v4();
const functionNameWithNoCaptureResponseViaMiddlewareOption = generateUniqueName(
  RESOURCE_NAME_PREFIX,
  uuidFunction4,
  runtime,
  'AllFeatures-Middy-NoCaptureResponse2'
);
const serviceNameWithNoCaptureResponseViaMiddlewareOption =
  functionNameWithNoCaptureResponseViaMiddlewareOption;

const xrayClient = new XRayClient({});
const stsClient = new STSClient({});
const invocations = 3;

const testStack = new TestStack(stackName);

describe(`Tracer E2E tests, all features with middy instantiation for runtime: ${runtime}`, () => {
  beforeAll(async () => {
    // Prepare
    startTime = new Date();
    const ddbTableName = stackName + '-table';

    const ddbTable = new Table(testStack.stack, 'Table', {
      tableName: ddbTableName,
      partitionKey: {
        name: 'id',
        type: AttributeType.STRING,
      },
      billingMode: BillingMode.PAY_PER_REQUEST,
      removalPolicy: RemovalPolicy.DESTROY,
    });

    const entry = path.join(__dirname, lambdaFunctionCodeFile);
    const functionWithAllFlagsEnabled = createTracerTestFunction({
      stack: testStack.stack,
      functionName: functionNameWithAllFlagsEnabled,
      entry,
      expectedServiceName: serviceNameWithAllFlagsEnabled,
      environmentParams: {
        TEST_TABLE_NAME: ddbTableName,
        POWERTOOLS_TRACER_CAPTURE_RESPONSE: 'true',
        POWERTOOLS_TRACER_CAPTURE_ERROR: 'true',
        POWERTOOLS_TRACE_ENABLED: 'true',
      },
      runtime,
    });
    ddbTable.grantWriteData(functionWithAllFlagsEnabled);

    const functionThatDoesNotCapturesErrorAndResponse =
      createTracerTestFunction({
        stack: testStack.stack,
        functionName: functionNameWithNoCaptureErrorOrResponse,
        entry,
        expectedServiceName: serviceNameWithNoCaptureErrorOrResponse,
        environmentParams: {
          TEST_TABLE_NAME: ddbTableName,
          POWERTOOLS_TRACER_CAPTURE_RESPONSE: 'false',
          POWERTOOLS_TRACER_CAPTURE_ERROR: 'false',
          POWERTOOLS_TRACE_ENABLED: 'true',
        },
        runtime,
      });
    ddbTable.grantWriteData(functionThatDoesNotCapturesErrorAndResponse);

    const functionWithTracerDisabled = createTracerTestFunction({
      stack: testStack.stack,
      functionName: functionNameWithTracerDisabled,
      entry,
      expectedServiceName: serviceNameWithTracerDisabled,
      environmentParams: {
        TEST_TABLE_NAME: ddbTableName,
        POWERTOOLS_TRACER_CAPTURE_RESPONSE: 'true',
        POWERTOOLS_TRACER_CAPTURE_ERROR: 'true',
        POWERTOOLS_TRACE_ENABLED: 'false',
      },
      runtime,
    });
    ddbTable.grantWriteData(functionWithTracerDisabled);

    const functionThatDoesNotCaptureResponseViaMiddlewareOption =
      createTracerTestFunction({
        stack: testStack.stack,
        functionName: functionNameWithNoCaptureResponseViaMiddlewareOption,
        entry,
        handler: 'handlerWithNoCaptureResponseViaMiddlewareOption',
        expectedServiceName:
          serviceNameWithNoCaptureResponseViaMiddlewareOption,
        environmentParams: {
          TEST_TABLE_NAME: ddbTableName,
          POWERTOOLS_TRACER_CAPTURE_RESPONSE: 'true',
          POWERTOOLS_TRACER_CAPTURE_ERROR: 'true',
          POWERTOOLS_TRACE_ENABLED: 'true',
        },
        runtime,
      });
    ddbTable.grantWriteData(
      functionThatDoesNotCaptureResponseViaMiddlewareOption
    );

    await testStack.deploy();

    // Act
    await Promise.all([
      invokeAllTestCases(functionNameWithAllFlagsEnabled),
      invokeAllTestCases(functionNameWithNoCaptureErrorOrResponse),
      invokeAllTestCases(functionNameWithTracerDisabled),
      invokeAllTestCases(functionNameWithNoCaptureResponseViaMiddlewareOption),
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
        await getFunctionArn(stsClient, functionNameWithAllFlagsEnabled),
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
      const tracesWhenAllFlagsEnabled = await getTraces(
        xrayClient,
        startTime,
        await getFunctionArn(stsClient, functionNameWithAllFlagsEnabled),
        invocations,
        4
      );

      for (let i = 0; i < invocations; i++) {
        const trace = tracesWhenAllFlagsEnabled[i];
        const invocationSubsegment = getInvocationSubsegment(trace);
        const handlerSubsegment = getFirstSubsegment(invocationSubsegment);
        const { annotations, metadata } = handlerSubsegment;

        const isColdStart = i === 0;
        assertAnnotation({
          annotations,
          isColdStart,
          expectedServiceName: serviceNameWithAllFlagsEnabled,
          expectedCustomAnnotationKey,
          expectedCustomAnnotationValue,
        });

        if (!metadata) {
          fail('metadata is missing');
        }
        expect(
          metadata[serviceNameWithAllFlagsEnabled][expectedCustomMetadataKey]
        ).toEqual(expectedCustomMetadataValue);

        const shouldThrowAnError = i === invocations - 1;
        if (!shouldThrowAnError) {
          // Assert that the metadata object contains the response
          expect(
            metadata[serviceNameWithAllFlagsEnabled]['index.handler response']
          ).toEqual(expectedCustomResponseValue);
        }
      }
    },
    TEST_CASE_TIMEOUT
  );

  it(
    'should not capture error nor response when the flags are false',
    async () => {
      const tracesWithNoCaptureErrorOrResponse = await getTraces(
        xrayClient,
        startTime,
        await getFunctionArn(
          stsClient,
          functionNameWithNoCaptureErrorOrResponse
        ),
        invocations,
        4
      );

      expect(tracesWithNoCaptureErrorOrResponse.length).toBe(invocations);

      // Assess
      for (let i = 0; i < invocations; i++) {
        const trace = tracesWithNoCaptureErrorOrResponse[i];

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
          // Assert that the subsegment has the expected fault
          expect(invocationSubsegment.error).toBe(true);
          expect(handlerSubsegment.error).toBe(true);
          // Assert that no error was captured on the subsegment
          expect(handlerSubsegment.hasOwnProperty('cause')).toBe(false);
        }
      }
    },
    TEST_CASE_TIMEOUT
  );

  it(
    'should not capture response when captureResponse is set to false',
    async () => {
      const tracesWithNoCaptureResponse = await getTraces(
        xrayClient,
        startTime,
        await getFunctionArn(
          stsClient,
          functionNameWithNoCaptureResponseViaMiddlewareOption
        ),
        invocations,
        4
      );

      expect(tracesWithNoCaptureResponse.length).toBe(invocations);

      // Assess
      for (let i = 0; i < invocations; i++) {
        const trace = tracesWithNoCaptureResponse[i];

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
         * Invocation subsegment should have a subsegment '## index.handlerWithNoCaptureResponseViaMiddlewareOption' (default behavior for Tracer)
         * '## index.handlerWithNoCaptureResponseViaMiddlewareOption' subsegment should have 2 subsegments
         * 1. DynamoDB (PutItem on the table)
         * 2. docs.powertools.aws.dev (Remote call)
         */
        const handlerSubsegment = getFirstSubsegment(invocationSubsegment);
        expect(handlerSubsegment.name).toBe(
          '## index.handlerWithNoCaptureResponseViaMiddlewareOption'
        );
        expect(handlerSubsegment?.subsegments).toHaveLength(2);

        if (!handlerSubsegment.subsegments) {
          fail(
            '"## index.handlerWithNoCaptureResponseViaMiddlewareOption" subsegment should have subsegments'
          );
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
    'should not capture any custom traces when disabled',
    async () => {
      const expectedNoOfTraces = 2;
      const tracesWithTracerDisabled = await getTraces(
        xrayClient,
        startTime,
        await getFunctionArn(stsClient, functionNameWithTracerDisabled),
        invocations,
        expectedNoOfTraces
      );

      expect(tracesWithTracerDisabled.length).toBe(invocations);

      // Assess
      for (let i = 0; i < invocations; i++) {
        const trace = tracesWithTracerDisabled[i];
        expect(trace.Segments.length).toBe(2);

        /**
         * Expect no subsegment in the invocation
         */
        const invocationSubsegment = getInvocationSubsegment(trace);
        expect(invocationSubsegment?.subsegments).toBeUndefined();

        const shouldThrowAnError = i === invocations - 1;
        if (shouldThrowAnError) {
          expect(invocationSubsegment.error).toBe(true);
        }
      }
    },
    TEST_CASE_TIMEOUT
  );
});

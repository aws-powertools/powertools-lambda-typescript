/**
 * Test tracer manual mode
 *
 * @group e2e/tracer/manual
 */

import { randomUUID } from 'crypto';
import path from 'path';
import { Table, AttributeType, BillingMode } from 'aws-cdk-lib/aws-dynamodb';
import { App, Stack, RemovalPolicy } from 'aws-cdk-lib';
import * as AWS from 'aws-sdk';
import { deployStack, destroyStack } from '../../../commons/tests/utils/cdk-cli';
import { 
  getTraces,
  getInvocationSubsegment,
  splitSegmentsByName,
  ParsedTrace,
  invokeAllTestCases,
  createTracerTestFunction,
  getFunctionArn,
  getFirstSubsegment,
} from '../helpers/tracesUtils';
import {
  generateUniqueName,
  isValidRuntimeKey,
} from '../../../commons/tests/utils/e2eUtils';
import { 
  RESOURCE_NAME_PREFIX,
  SETUP_TIMEOUT, 
  TEARDOWN_TIMEOUT, 
  TEST_CASE_TIMEOUT,
  expectedCustomAnnotationKey, 
  expectedCustomAnnotationValue, 
  expectedCustomMetadataKey, 
  expectedCustomMetadataValue, 
  expectedCustomResponseValue, 
  expectedCustomErrorMessage,
} from './constants';
import { 
  assertErrorAndFault,
  assertAnnotation
} from '../helpers/traceAssertions';

const runtime: string = process.env.RUNTIME || 'nodejs16x';

if (!isValidRuntimeKey(runtime)) {
  throw new Error(`Invalid runtime key value: ${runtime}`);
}

const uuid = randomUUID();
const stackName = generateUniqueName(RESOURCE_NAME_PREFIX, uuid, runtime, 'AllFeatures-Manual');
const functionName = generateUniqueName(RESOURCE_NAME_PREFIX, uuid, runtime, 'AllFeatures-Manual');
const lambdaFunctionCodeFile = 'allFeatures.manual.test.functionCode.ts';
const expectedServiceName = functionName; 

const xray = new AWS.XRay();
const invocations = 3;
let sortedTraces: ParsedTrace[];

const integTestApp = new App();
let stack: Stack;

describe(`Tracer E2E tests, all features with manual instantiation for runtime: ${runtime}`, () => {

  beforeAll(async () => {
    
    // Prepare
    const startTime = new Date();
    const ddbTableName = stackName + '-table';
    stack = new Stack(integTestApp, stackName);

    const entry = path.join(__dirname, lambdaFunctionCodeFile);
    const environmentParams = {
      TEST_TABLE_NAME: ddbTableName,
      POWERTOOLS_TRACER_CAPTURE_RESPONSE: 'true',
      POWERTOOLS_TRACER_CAPTURE_ERROR: 'true',
      POWERTOOLS_TRACE_ENABLED: 'true',
    };
    const testFunction = createTracerTestFunction({
      stack,
      functionName,
      entry,
      expectedServiceName,
      environmentParams,
      runtime
    });
    
    const ddbTable = new Table(stack, 'Table', {
      tableName: ddbTableName,
      partitionKey: {
        name: 'id',
        type: AttributeType.STRING
      },
      billingMode: BillingMode.PAY_PER_REQUEST,
      removalPolicy: RemovalPolicy.DESTROY
    });

    ddbTable.grantWriteData(testFunction);

    await deployStack(integTestApp, stack);

    // Act
    await invokeAllTestCases(functionName);

    // Retrieve traces from X-Ray for assertion
    const lambdaFunctionArn = await getFunctionArn(functionName);
    sortedTraces = await getTraces(xray, startTime, lambdaFunctionArn, invocations, 5);
    
  }, SETUP_TIMEOUT);

  afterAll(async () => {
    if (!process.env.DISABLE_TEARDOWN) {
      await destroyStack(integTestApp, stack);
    }
  }, TEARDOWN_TIMEOUT);

  it('should generate all custom traces', async () => {
    
    expect(sortedTraces.length).toBe(invocations);

    // Assess
    for (let i = 0; i < invocations; i++) {
      const trace = sortedTraces[i];

      /**
       * Expect the trace to have 5 segments:
       * 1. Lambda Context (AWS::Lambda)
       * 2. Lambda Function (AWS::Lambda::Function)
       * 3. DynamoDB (AWS::DynamoDB)
       * 4. DynamoDB Table (AWS::DynamoDB::Table)
       * 5. Remote call (httpbin.org)
       */
      expect(trace.Segments.length).toBe(5);
      const invocationSubsegment = getInvocationSubsegment(trace);
      
      /**
       * Invocation subsegment should have a subsegment '## index.handler' (default behavior for PowerTool tracer)
       * '## index.handler' subsegment should have 3 subsegments
       * 1. DynamoDB (PutItem on the table)
       * 2. DynamoDB (PutItem overhead)
       * 3. httpbin.org (Remote call)
       */
      const handlerSubsegment = getFirstSubsegment(invocationSubsegment);
      expect(handlerSubsegment.name).toBe('## index.handler');
      expect(handlerSubsegment?.subsegments).toHaveLength(3);

      if (!handlerSubsegment.subsegments) {
        fail('"## index.handler" subsegment should have subsegments');
      }
      const subsegments = splitSegmentsByName(handlerSubsegment.subsegments, [ 'DynamoDB', 'httpbin.org' ]);
      expect(subsegments.get('DynamoDB')?.length).toBe(2);
      expect(subsegments.get('httpbin.org')?.length).toBe(1);
      expect(subsegments.get('other')?.length).toBe(0);
      
      const shouldThrowAnError = (i === (invocations - 1));
      if (shouldThrowAnError) {
        assertErrorAndFault(invocationSubsegment, expectedCustomErrorMessage);
      }
    }

  }, TEST_CASE_TIMEOUT);
  
  it('should have correct annotations and metadata', async () => {
    for (let i = 0; i < invocations; i++) {
      const trace = sortedTraces[i];
      const invocationSubsegment = getInvocationSubsegment(trace);
      const handlerSubsegment = getFirstSubsegment(invocationSubsegment);
      const { annotations, metadata } = handlerSubsegment;

      const isColdStart = (i === 0);
      assertAnnotation({
        annotations,
        isColdStart,
        expectedServiceName,
        expectedCustomAnnotationKey,
        expectedCustomAnnotationValue,
      });
      
      if (!metadata) {
        fail('metadata is missing');
      }
      expect(metadata[expectedServiceName][expectedCustomMetadataKey])
        .toEqual(expectedCustomMetadataValue);

      const shouldThrowAnError = (i === (invocations - 1));
      if (!shouldThrowAnError) {
        // Assert that the metadata object contains the response
        expect(metadata[expectedServiceName]['index.handler response'])
          .toEqual(expectedCustomResponseValue);
      }
    }
  }, TEST_CASE_TIMEOUT);

});


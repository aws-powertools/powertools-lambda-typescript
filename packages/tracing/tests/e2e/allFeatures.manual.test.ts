/**
 * Test tracer manual mode
 *
 * @group e2e/tracer/manual
 */

import { randomUUID } from 'crypto';
import path from 'path';
import { Table, AttributeType, BillingMode } from 'aws-cdk-lib/aws-dynamodb';
import { App, Stack, RemovalPolicy, Duration } from 'aws-cdk-lib';
import { deployStack, destroyStack } from '@aws-lambda-powertools/commons/tests/utils/cdk-cli';
import * as AWS from 'aws-sdk';
import { getTraces, getInvocationSubsegment, splitSegmentsByName, ParsedTrace } from '../helpers/tracesUtils';
import {
  generateUniqueName,
  isValidRuntimeKey,
  TestRuntimesKey,
  TEST_RUNTIMES,
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
import { Architecture, Tracing } from 'aws-cdk-lib/aws-lambda';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';

const runtime: string = process.env.RUNTIME || 'nodejs14x';

if (!isValidRuntimeKey(runtime)) {
  throw new Error(`Invalid runtime key value: ${runtime}`);
}

const uuid = randomUUID();
const stackName = generateUniqueName(RESOURCE_NAME_PREFIX, uuid, runtime, 'AllFeatures-Manual');
const functionName = generateUniqueName(RESOURCE_NAME_PREFIX, uuid, runtime, 'AllFeatures-Manual');
const lambdaFunctionCodeFile = 'allFeatures.manual.test.functionCode.ts';
const expectedServiceName = functionName; 
let startTime : Date;

const lambdaClient = new AWS.Lambda();
const xray = new AWS.XRay();
const invocations = 3;
let sortedTraces: ParsedTrace[];

const integTestApp = new App();
let stack: Stack;

const getFunctionArn = async (functionName: string): Promise<string> => {
  const stsClient = new AWS.STS();
  const region = process.env.AWS_REGION;
  const identity = await stsClient.getCallerIdentity().promise();
  const account = identity.Account;
  
  return `arn:aws:lambda:${region}:${account}:function:${functionName}`;
};

describe(`Tracer E2E tests, all features with manual instantiation for runtime: ${runtime}`, () => {

  beforeAll(async () => {
    
    // Prepare
    startTime = new Date();
    const ddbTableName = stackName + '-table';
    stack = new Stack(integTestApp, stackName);

    const testFunction = new NodejsFunction(stack, functionName, {
      entry: path.join(__dirname, lambdaFunctionCodeFile),
      functionName: functionName,
      handler: 'handler',
      tracing: Tracing.ACTIVE,
      architecture: Architecture.X86_64,
      memorySize: 256,
      environment: {
        EXPECTED_SERVICE_NAME: expectedServiceName,
        EXPECTED_CUSTOM_ANNOTATION_KEY: expectedCustomAnnotationKey,
        EXPECTED_CUSTOM_ANNOTATION_VALUE: expectedCustomAnnotationValue,
        EXPECTED_CUSTOM_METADATA_KEY: expectedCustomMetadataKey,
        EXPECTED_CUSTOM_METADATA_VALUE: JSON.stringify(expectedCustomMetadataValue),
        EXPECTED_CUSTOM_RESPONSE_VALUE: JSON.stringify(expectedCustomResponseValue),
        EXPECTED_CUSTOM_ERROR_MESSAGE: expectedCustomErrorMessage,
        POWERTOOLS_TRACER_CAPTURE_RESPONSE: 'true',
        POWERTOOLS_TRACER_CAPTURE_ERROR: 'true',
        POWERTOOLS_TRACE_ENABLED: 'true',
        TEST_TABLE_NAME: ddbTableName,
      },
      timeout: Duration.seconds(30),
      bundling: {
        externalModules: ['aws-sdk'],
      },
      runtime: TEST_RUNTIMES[runtime as TestRuntimesKey],
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
    for (let i = 0; i < invocations; i++) {
      await lambdaClient.invoke({
        FunctionName: functionName,
        LogType: 'Tail',
        Payload: JSON.stringify({
          throw: i === invocations - 1 ? true : false, // only last invocation should throw
          sdkV2: i === 1 ? 'all' : 'client', // only second invocation should use captureAll
          invocation: i + 1, // Pass invocation number for easier debugging
        }),
      }).promise();
    }

    // Retrieve traces from X-Ray for assertion
    const lambdaFunctionArn = await getFunctionArn(functionName);
    sortedTraces = await getTraces(xray, startTime, lambdaFunctionArn, invocations, 5);
    
  }, SETUP_TIMEOUT);

  afterAll(async () => {
    if (!process.env.DISABLE_TEARDOWN) {
      await destroyStack(integTestApp, stack);
    }
  }, TEARDOWN_TIMEOUT);

  it('should generate all custom traces with correct annotations and metadata', async () => {
    
    expect(sortedTraces.length).toBe(invocations);

    // Assess
    for (let i = 0; i < invocations; i++) {
      const trace = sortedTraces[i];

      /**
       *   Expect the trace to have 5 segments:
       * 1. Lambda Context (AWS::Lambda)
       * 2. Lambda Function (AWS::Lambda::Function)
       * 3. DynamoDB (AWS::DynamoDB)
       * 4. DynamoDB Table (AWS::DynamoDB::Table)
       * 5. Remote call (httpbin.org)
       */
      expect(trace.Segments.length).toBe(5);

      const invocationSubsegment = getInvocationSubsegment(trace);

      if (invocationSubsegment?.subsegments !== undefined) {
        expect(invocationSubsegment?.subsegments?.length).toBe(1);
        
        /**
         * Invocation subsegment should have a subsegment '## index.handler' (default behavior for PowerTool tracer)
         */
        const handlerSubsegment = invocationSubsegment?.subsegments[0];
        expect(handlerSubsegment.name).toBe('## index.handler');
        
        if (handlerSubsegment?.subsegments !== undefined) {
          /**
           * '## index.handler' subsegment should have 3 subsegments
           * 1. DynamoDB (PutItem on the table)
           * 2. DynamoDB (PutItem overhead)
           * 3. httpbin.org (Remote call)
           */
          expect(handlerSubsegment?.subsegments?.length).toBe(3);

          const subsegments = splitSegmentsByName(handlerSubsegment.subsegments, [ 'DynamoDB', 'httpbin.org' ]);
          // Assert that there are exactly two subsegment with the name 'DynamoDB'
          expect(subsegments.get('DynamoDB')?.length).toBe(2);
          // Assert that there is exactly one subsegment with the name 'httpbin.org'
          expect(subsegments.get('httpbin.org')?.length).toBe(1);
          // Assert that there are exactly zero other subsegments
          expect(subsegments.get('other')?.length).toBe(0);
          
          const { annotations, metadata } = handlerSubsegment;

          if (annotations !== undefined && metadata !== undefined) {
            // Assert that the annotations are as expected
            expect(annotations['ColdStart']).toEqual(true ? i === 0 : false);
            expect(annotations['Service']).toEqual(expectedServiceName);
            expect(annotations[expectedCustomAnnotationKey]).toEqual(expectedCustomAnnotationValue);
            // Assert that the metadata object is as expected
            expect(metadata[expectedServiceName][expectedCustomMetadataKey])
              .toEqual(expectedCustomMetadataValue);
            
            if (i === invocations - 1) {
              // Assert that the subsegment has the expected fault
              expect(invocationSubsegment.error).toBe(true);
              expect(handlerSubsegment.fault).toBe(true);
              expect(handlerSubsegment.hasOwnProperty('cause')).toBe(true);
              expect(handlerSubsegment.cause?.exceptions[0].message).toBe(expectedCustomErrorMessage);
            } else {
              // Assert that the metadata object contains the response
              expect(metadata[expectedServiceName]['index.handler response'])
                .toEqual(expectedCustomResponseValue);
            }
          } else {
            // Make test fail if there are no annotations or metadata
            fail('There is no annotations or metadata in the handler subsgement')
          }
        } else {
          fail('Handler subsegment does NOT have any subsebments');
        }
      } else {
        fail('Invocation subsegment does NOT have a handler subsebment');
      }
    }

  }, TEST_CASE_TIMEOUT);

});


import { join } from 'node:path';
import { TestStack } from '@aws-lambda-powertools/testing-utils';
import { TestDynamodbTable } from '@aws-lambda-powertools/testing-utils/resources/dynamodb';
import { TestNodejsFunction } from '@aws-lambda-powertools/testing-utils/resources/lambda';
import { getTraces } from '@aws-lambda-powertools/testing-utils/utils/xray-traces';
import type { EnrichedXRayTraceDocumentParsed } from 'packages/testing/lib/cjs/types.js';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { invokeAllTestCases } from '../helpers/invokeAllTests.js';
import {
  RESOURCE_NAME_PREFIX,
  EXPECTED_ANNOTATION_KEY as expectedCustomAnnotationKey,
  EXPECTED_ANNOTATION_VALUE as expectedCustomAnnotationValue,
  EXPECTED_ERROR_MESSAGE as expectedCustomErrorMessage,
  EXPECTED_METADATA_KEY as expectedCustomMetadataKey,
  EXPECTED_METADATA_VALUE as expectedCustomMetadataValue,
  EXPECTED_RESPONSE_VALUE as expectedCustomResponseValue,
} from './constants.js';

describe('Tracer E2E tests, manual instantiation', () => {
  const testStack = new TestStack({
    stackNameProps: {
      stackNamePrefix: RESOURCE_NAME_PREFIX,
      testName: 'Manual',
    },
  });

  // Location of the lambda function code
  const lambdaFunctionCodeFilePath = join(
    __dirname,
    'manual.test.functionCode.ts'
  );
  const startTime = new Date();

  const testTable = new TestDynamodbTable(
    testStack,
    {},
    {
      nameSuffix: 'TestTable',
    }
  );

  const fnManual = new TestNodejsFunction(
    testStack,
    {
      entry: lambdaFunctionCodeFilePath,
      environment: {
        TEST_TABLE_NAME: testTable.tableName,
        POWERTOOLS_SERVICE_NAME: 'Manual',
      },
    },
    {
      nameSuffix: 'Manual',
    }
  );
  testTable.grantWriteData(fnManual);

  const invocationCount = 2;
  let traceData: EnrichedXRayTraceDocumentParsed[] = [];

  beforeAll(async () => {
    // Deploy the stack
    await testStack.deploy();

    // Get the actual function names from the stack outputs
    const fnNameManual = testStack.findAndGetStackOutputValue('Manual');

    // Invoke all test cases
    await invokeAllTestCases(fnNameManual, invocationCount);
    traceData = await getTraces({
      startTime,
      resourceName: fnNameManual,
      expectedTracesCount: invocationCount,
      /**
       * The trace should have 2 segments:
       * 1. Lambda Context (AWS::Lambda)
       * 2. Lambda Function (AWS::Lambda::Function)
       */
      expectedSegmentsCount: 2,
    });
  });

  afterAll(async () => {
    if (!process.env.DISABLE_TEARDOWN) {
      await testStack.destroy();
    }
  });

  it('should generate all trace data correctly', async () => {
    // Assess
    const mainSubsegment = traceData[0];
    const { subsegments, annotations, metadata } = mainSubsegment;

    // Check the main segment name
    expect(mainSubsegment.name).toBe('## index.handler');

    // Since CaptureHTTPsRequests is disabled, we should not have any subsegments
    expect(subsegments.size).toBe(0);

    // Check the annotations of the main segment
    if (!annotations) {
      throw new Error('No annotations found on the main segment');
    }
    expect(annotations.ColdStart).toEqual(true);
    expect(annotations.Service).toEqual('Manual');
    expect(annotations[expectedCustomAnnotationKey]).toEqual(
      expectedCustomAnnotationValue
    );

    // Check the metadata of the main segment
    if (!metadata) {
      throw new Error('No metadata found on the main segment');
    }
    expect(metadata.Manual?.[expectedCustomMetadataKey]).toEqual(
      expectedCustomMetadataValue
    );

    // Check the response is present in the metadata
    expect(metadata.Manual?.['index.handler response']).toEqual(
      expectedCustomResponseValue
    );
  });

  it('should annotate the trace with error data correctly', () => {
    const mainSubsegment = traceData[1];
    const { annotations } = mainSubsegment;

    // Check the annotations of the main segment
    if (!annotations) {
      throw new Error('No annotations found on the main segment');
    }
    expect(annotations.ColdStart).toEqual(false);

    // Check that the main segment has error data
    expect(mainSubsegment.fault).toBe(true);
    expect(Object.hasOwn(mainSubsegment, 'cause')).toBe(true);
    expect(mainSubsegment.cause?.exceptions[0].message).toBe(
      expectedCustomErrorMessage
    );
  });
});

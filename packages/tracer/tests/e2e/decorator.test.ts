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
  SETUP_TIMEOUT,
  TEARDOWN_TIMEOUT,
  EXPECTED_ANNOTATION_KEY as expectedCustomAnnotationKey,
  EXPECTED_ANNOTATION_VALUE as expectedCustomAnnotationValue,
  EXPECTED_ERROR_MESSAGE as expectedCustomErrorMessage,
  EXPECTED_METADATA_KEY as expectedCustomMetadataKey,
  EXPECTED_METADATA_VALUE as expectedCustomMetadataValue,
  EXPECTED_RESPONSE_VALUE as expectedCustomResponseValue,
  EXPECTED_SUBSEGMENT_NAME as expectedCustomSubSegmentName,
} from './constants.js';

describe('Tracer E2E tests, decorator instrumentation', () => {
  const testStack = new TestStack({
    stackNameProps: {
      stackNamePrefix: RESOURCE_NAME_PREFIX,
      testName: 'Decorator',
    },
  });

  // Location of the lambda function code
  const lambdaFunctionCodeFilePath = join(
    __dirname,
    'decorator.test.functionCode.ts'
  );
  const startTime = new Date();

  const testTable = new TestDynamodbTable(
    testStack,
    {},
    {
      nameSuffix: 'TestTable',
    }
  );

  const fnDecorator = new TestNodejsFunction(
    testStack,
    {
      entry: lambdaFunctionCodeFilePath,
      environment: {
        TEST_TABLE_NAME: testTable.tableName,
        POWERTOOLS_SERVICE_NAME: 'Decorator',
      },
    },
    {
      nameSuffix: 'Decorator',
    }
  );
  testTable.grantWriteData(fnDecorator);

  const invocationCount = 2;
  let traceData: EnrichedXRayTraceDocumentParsed[] = [];

  beforeAll(async () => {
    // Deploy the stack
    await testStack.deploy();

    // Get the actual function names from the stack outputs
    const fnNameDecorator = testStack.findAndGetStackOutputValue('Decorator');

    // Act
    await invokeAllTestCases(fnNameDecorator, invocationCount);
    traceData = await getTraces({
      startTime,
      resourceName: fnNameDecorator,
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
  }, SETUP_TIMEOUT);

  afterAll(async () => {
    if (!process.env.DISABLE_TEARDOWN) {
      await testStack.destroy();
    }
  }, TEARDOWN_TIMEOUT);

  it('should generate all trace data correctly', async () => {
    // Assess
    const mainSubsegment = traceData[0];
    const { subsegments, annotations, metadata } = mainSubsegment;

    // Check the main segment name
    expect(mainSubsegment.name).toBe('## index.handler');

    // Check the subsegments of the main segment
    expect(subsegments.size).toBe(3);

    // Check remote call subsegment
    expect(subsegments.has('docs.powertools.aws.dev')).toBe(true);
    const httpSubsegment = subsegments.get('docs.powertools.aws.dev');
    expect(httpSubsegment?.namespace).toBe('remote');
    expect(httpSubsegment?.http?.request?.url).toEqual(
      'https://docs.powertools.aws.dev/lambda/typescript/latest/'
    );
    expect(httpSubsegment?.http?.request?.method).toBe('GET');
    expect(httpSubsegment?.http?.response?.status).toEqual(expect.any(Number));
    expect(httpSubsegment?.http?.response?.status).toEqual(expect.any(Number));

    // Check the custom subsegment name & metadata
    expect(subsegments.has(expectedCustomSubSegmentName)).toBe(true);
    expect(
      subsegments.get(expectedCustomSubSegmentName)?.metadata
    ).toStrictEqual({
      Decorator: {
        'myMethod response': expectedCustomResponseValue,
      },
    });

    // Check the other custom subsegment and its subsegments
    expect(subsegments.has('### methodNoResponse')).toBe(true);
    expect(subsegments.get('### methodNoResponse')?.metadata).toBeUndefined();
    expect(subsegments.get('### methodNoResponse')?.subsegments?.length).toBe(
      1
    );
    expect(
      subsegments.get('### methodNoResponse')?.subsegments?.[0]?.name ===
        'DynamoDB'
    ).toBe(true);

    // Check the annotations of the main segment
    if (!annotations) {
      throw new Error('No annotations found on the main segment');
    }
    expect(annotations.ColdStart).toEqual(true);
    expect(annotations.Service).toEqual('Decorator');
    expect(annotations[expectedCustomAnnotationKey]).toEqual(
      expectedCustomAnnotationValue
    );

    // Check the metadata of the main segment
    if (!metadata) {
      throw new Error('No metadata found on the main segment');
    }
    expect(metadata.Decorator[expectedCustomMetadataKey]).toEqual(
      expectedCustomMetadataValue
    );

    // Check the response is present in the metadata
    expect(metadata.Decorator['index.handler response']).toEqual(
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

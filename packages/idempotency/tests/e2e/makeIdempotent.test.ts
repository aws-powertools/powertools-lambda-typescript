import { createHash } from 'node:crypto';
import { join } from 'node:path';
import {
  TestInvocationLogs,
  TestStack,
  invokeFunction,
} from '@aws-lambda-powertools/testing-utils';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { ScanCommand } from '@aws-sdk/lib-dynamodb';
import { AttributeType } from 'aws-cdk-lib/aws-dynamodb';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { IdempotencyTestNodejsFunctionAndDynamoTable } from '../helpers/resources.js';
import {
  RESOURCE_NAME_PREFIX,
  SETUP_TIMEOUT,
  TEARDOWN_TIMEOUT,
  TEST_CASE_TIMEOUT,
} from './constants';

describe('Idempotency E2E tests, wrapper function usage', () => {
  const testStack = new TestStack({
    stackNameProps: {
      stackNamePrefix: RESOURCE_NAME_PREFIX,
      testName: 'makeFnIdempotent',
    },
  });

  // Location of the lambda function code
  const lambdaFunctionCodeFilePath = join(
    __dirname,
    'makeIdempotent.test.FunctionCode.ts'
  );

  let functionNameDefault: string;
  let tableNameDefault: string;
  new IdempotencyTestNodejsFunctionAndDynamoTable(
    testStack,
    {
      function: {
        entry: lambdaFunctionCodeFilePath,
        handler: 'handlerDefault',
      },
    },
    {
      nameSuffix: 'default',
    }
  );

  let functionNameCustomConfig: string;
  let tableNameCustomConfig: string;
  new IdempotencyTestNodejsFunctionAndDynamoTable(
    testStack,
    {
      function: {
        entry: lambdaFunctionCodeFilePath,
        handler: 'handlerCustomized',
      },
      table: {
        partitionKey: {
          name: 'customId',
          type: AttributeType.STRING,
        },
      },
    },
    {
      nameSuffix: 'customConfig',
    }
  );

  let functionNameLambdaHandler: string;
  let tableNameLambdaHandler: string;
  new IdempotencyTestNodejsFunctionAndDynamoTable(
    testStack,
    {
      function: {
        entry: lambdaFunctionCodeFilePath,
        handler: 'handlerLambda',
      },
    },
    {
      nameSuffix: 'handler',
    }
  );

  const ddb = new DynamoDBClient({});

  beforeAll(async () => {
    // Deploy the stack
    await testStack.deploy();

    // Get the actual function names from the stack outputs
    functionNameDefault = testStack.findAndGetStackOutputValue('defaultFn');
    tableNameDefault = testStack.findAndGetStackOutputValue('defaultTable');
    functionNameCustomConfig =
      testStack.findAndGetStackOutputValue('customConfigFn');
    tableNameCustomConfig =
      testStack.findAndGetStackOutputValue('customConfigTable');
    functionNameLambdaHandler =
      testStack.findAndGetStackOutputValue('handlerFn');
    tableNameLambdaHandler =
      testStack.findAndGetStackOutputValue('handlerTable');
  }, SETUP_TIMEOUT);

  it(
    'when called twice with the same payload, it returns the same result',
    async () => {
      // Prepare
      const payload = {
        records: [
          { foo: 'bar', id: 1 },
          { foo: 'baz', id: 2 },
          { foo: 'bar', id: 1 },
        ],
      };
      const payloadHashes = payload.records.map((record) =>
        createHash('md5').update(JSON.stringify(record)).digest('base64')
      );

      // Act
      const logs = await invokeFunction({
        functionName: functionNameDefault,
        times: 2,
        invocationMode: 'SEQUENTIAL',
        payload,
      });
      const functionLogs = logs.map((log) => log.getFunctionLogs());

      // Assess
      const idempotencyRecords = await ddb.send(
        new ScanCommand({
          TableName: tableNameDefault,
        })
      );
      // Since records 1 and 3 have the same payload, only 2 records should be created
      expect(idempotencyRecords?.Items?.length).toEqual(2);
      const idempotencyRecordsItems = [
        idempotencyRecords.Items?.find(
          (record) => record.id === `${functionNameDefault}#${payloadHashes[0]}`
        ),
        idempotencyRecords.Items?.find(
          (record) => record.id === `${functionNameDefault}#${payloadHashes[1]}`
        ),
      ];

      expect(idempotencyRecordsItems?.[0]).toStrictEqual({
        id: `${functionNameDefault}#${payloadHashes[0]}`,
        data: 'Processing done: bar',
        status: 'COMPLETED',
        expiration: expect.any(Number),
        in_progress_expiration: expect.any(Number),
      });

      expect(idempotencyRecordsItems?.[1]).toStrictEqual({
        id: `${functionNameDefault}#${payloadHashes[1]}`,
        data: 'Processing done: baz',
        status: 'COMPLETED',
        expiration: expect.any(Number),
        in_progress_expiration: expect.any(Number),
      });

      expect(functionLogs[0]).toHaveLength(2);
    },
    TEST_CASE_TIMEOUT
  );

  it(
    'creates a DynamoDB item with the correct attributes',
    async () => {
      // Prepare
      const payload = {
        records: [
          { foo: 'bar', id: 1 },
          { foo: 'baq', id: 2 },
          { foo: 'bar', id: 3 },
        ],
      };
      const payloadHashes = payload.records.map((record) =>
        createHash('md5').update(JSON.stringify(record)).digest('base64')
      );
      const validationHashes = payload.records.map((record) =>
        createHash('md5').update(JSON.stringify(record.foo)).digest('base64')
      );

      // Act
      const logs = await invokeFunction({
        functionName: functionNameCustomConfig,
        times: 2,
        invocationMode: 'SEQUENTIAL',
        payload,
      });
      const functionLogs = logs.map((log) => log.getFunctionLogs());

      // Assess
      const idempotencyRecords = await ddb.send(
        new ScanCommand({
          TableName: tableNameCustomConfig,
        })
      );
      /**
       * Each record should have a corresponding entry in the persistence store,
       * if so then we retrieve the records based on their custom IDs
       * The records are retrieved in the same order as the payload records.
       */
      expect(idempotencyRecords.Items?.length).toEqual(3);
      const idempotencyRecordsItems = [
        idempotencyRecords.Items?.find(
          (record) =>
            record.customId ===
            `${functionNameCustomConfig}#${payloadHashes[0]}`
        ),
        idempotencyRecords.Items?.find(
          (record) =>
            record.customId ===
            `${functionNameCustomConfig}#${payloadHashes[1]}`
        ),
        idempotencyRecords.Items?.find(
          (record) =>
            record.customId ===
            `${functionNameCustomConfig}#${payloadHashes[2]}`
        ),
      ];

      expect(idempotencyRecordsItems?.[0]).toStrictEqual({
        customId: `${functionNameCustomConfig}#${payloadHashes[0]}`,
        dataAttr: payload.records[0],
        statusAttr: 'COMPLETED',
        expiryAttr: expect.any(Number),
        inProgressExpiryAttr: expect.any(Number),
        validationKeyAttr: validationHashes[0],
      });

      expect(idempotencyRecordsItems?.[1]).toStrictEqual({
        customId: `${functionNameCustomConfig}#${payloadHashes[1]}`,
        dataAttr: payload.records[1],
        statusAttr: 'COMPLETED',
        expiryAttr: expect.any(Number),
        inProgressExpiryAttr: expect.any(Number),
        validationKeyAttr: validationHashes[1],
      });

      expect(idempotencyRecordsItems?.[2]).toStrictEqual({
        customId: `${functionNameCustomConfig}#${payloadHashes[2]}`,
        dataAttr: payload.records[2],
        statusAttr: 'COMPLETED',
        expiryAttr: expect.any(Number),
        inProgressExpiryAttr: expect.any(Number),
        validationKeyAttr: validationHashes[2],
      });

      // During the first invocation, the processing function should have been called 3 times (once for each record)
      expect(functionLogs[0]).toHaveLength(3);
      expect(TestInvocationLogs.parseFunctionLog(functionLogs[0][0])).toEqual(
        expect.objectContaining({
          baz: 0, // index of recursion in handler, assess that all function arguments are preserved
          record: payload.records[0],
          message: 'Got test event',
        })
      );
      expect(TestInvocationLogs.parseFunctionLog(functionLogs[0][1])).toEqual(
        expect.objectContaining({
          baz: 1,
          record: payload.records[1],
          message: 'Got test event',
        })
      );
      expect(TestInvocationLogs.parseFunctionLog(functionLogs[0][2])).toEqual(
        expect.objectContaining({
          baz: 2,
          record: payload.records[2],
          message: 'Got test event',
        })
      );

      // During the second invocation, the processing function should have been called 0 times (all records are idempotent)
      expect(functionLogs[1]).toHaveLength(0);
    },
    TEST_CASE_TIMEOUT
  );

  it(
    'calls the wrapped function once and always returns the same result when called multiple times',
    async () => {
      // Prepare
      const payload = {
        body: JSON.stringify({
          foo: 'bar',
        }),
      };
      const payloadHash = createHash('md5')
        .update(JSON.stringify('bar'))
        .digest('base64');

      // Act
      const logs = await invokeFunction({
        functionName: functionNameLambdaHandler,
        times: 2,
        invocationMode: 'SEQUENTIAL',
        payload,
      });
      const functionLogs = logs.map((log) => log.getFunctionLogs());

      // Assess
      const idempotencyRecords = await ddb.send(
        new ScanCommand({
          TableName: tableNameLambdaHandler,
        })
      );
      expect(idempotencyRecords.Items?.length).toEqual(1);
      expect(idempotencyRecords.Items?.[0].id).toEqual(
        `${functionNameLambdaHandler}#${payloadHash}`
      );
      expect(idempotencyRecords.Items?.[0].data).toEqual('bar');
      expect(idempotencyRecords.Items?.[0].status).toEqual('COMPLETED');

      // During the first invocation the handler should be called, so the logs should contain 1 log
      expect(functionLogs[0]).toHaveLength(1);
      // We test the content of the log as well as the presence of fields from the context, this
      // ensures that the all the arguments are passed to the handler when made idempotent
      expect(TestInvocationLogs.parseFunctionLog(functionLogs[0][0])).toEqual(
        expect.objectContaining({
          message: 'foo',
          details: 'bar',
          function_name: functionNameLambdaHandler,
        })
      );
      // During the second invocation the handler should not be called, so the logs should be empty
      expect(functionLogs[1]).toHaveLength(0);
    },
    TEST_CASE_TIMEOUT
  );

  afterAll(async () => {
    if (!process.env.DISABLE_TEARDOWN) {
      await testStack.destroy();
    }
  }, TEARDOWN_TIMEOUT);
});

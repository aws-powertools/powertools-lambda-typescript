import { createHash } from 'node:crypto';
import { join } from 'node:path';
import {
  getRuntimeKey,
  invokeFunction,
  TestStack,
} from '@aws-lambda-powertools/testing-utils';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { ScanCommand } from '@aws-sdk/lib-dynamodb';
import { Duration } from 'aws-cdk-lib';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { IdempotencyTestNodejsFunctionAndDynamoTable } from '../helpers/resources.js';
import { RESOURCE_NAME_PREFIX } from './constants.js';

describe('Idempotency E2E tests, durable functions', () => {
  const testStack = new TestStack({
    stackNameProps: {
      stackNamePrefix: RESOURCE_NAME_PREFIX,
      testName: 'durable',
    },
  });

  // Location of the lambda function code
  const lambdaFunctionCodeFilePath = join(
    __dirname,
    'durableIdempotent.FunctionCode.ts'
  );

  let functionNameDurable: string;
  let tableNameDurable: string;
  if (getRuntimeKey() !== 'nodejs20x') {
    new IdempotencyTestNodejsFunctionAndDynamoTable(
      testStack,
      {
        function: {
          entry: lambdaFunctionCodeFilePath,
          handler: 'handlerDurable',
          durableConfig: {
            executionTimeout: Duration.minutes(5),
            retentionPeriod: Duration.days(1),
          },
        },
      },
      {
        nameSuffix: 'durable',
      }
    );
  }

  const ddb = new DynamoDBClient({});

  beforeAll(async () => {
    // Deploy the stack
    await testStack.deploy();

    // Get the actual function names from the stack outputs
    if (getRuntimeKey() !== 'nodejs20x') {
      functionNameDurable = testStack.findAndGetStackOutputValue('durableFn');
      tableNameDurable = testStack.findAndGetStackOutputValue('durableTable');
    }
  });

  it.skipIf(getRuntimeKey() === 'nodejs20x')(
    'calls an idempotent durable function and always returns the same result when called multiple times',
    async () => {
      // Prepare
      const payload = {
        foo: 'bar',
      };
      const payloadHash = createHash('md5')
        .update(JSON.stringify(payload))
        .digest('base64');

      // Act
      await invokeFunction({
        functionName: `${functionNameDurable}:$LATEST`,
        times: 2,
        invocationMode: 'SEQUENTIAL',
        payload,
      });

      // Assess
      const idempotencyRecords = await ddb.send(
        new ScanCommand({
          TableName: tableNameDurable,
        })
      );
      expect(idempotencyRecords.Items?.length).toEqual(1);
      expect(idempotencyRecords.Items?.[0].id).toEqual(
        `${functionNameDurable}#${payloadHash}`
      );
    }
  );

  afterAll(async () => {
    if (!process.env.DISABLE_TEARDOWN) {
      await testStack.destroy();
    }
  });
});

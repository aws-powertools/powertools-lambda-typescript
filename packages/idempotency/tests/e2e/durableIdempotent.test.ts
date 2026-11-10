import { createHash, randomUUID } from 'node:crypto';
import { join } from 'node:path';
import type { JSONValue } from '@aws-lambda-powertools/commons/types';
import {
  getDurableExecutionHistory,
  startDurableExecution,
  TestStack,
  waitForDurableExecution,
} from '@aws-lambda-powertools/testing-utils';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import type { Event } from '@aws-sdk/client-lambda';
import { DynamoDBDocumentClient, GetCommand } from '@aws-sdk/lib-dynamodb';
import { Duration } from 'aws-cdk-lib';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { deepSort } from '../../src/deepSort.js';
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
  const durableConfig = {
    executionTimeout: Duration.minutes(5),
    retentionPeriod: Duration.days(1),
  };

  let functionNameDurable: string;
  let tableNameDurable: string;
  new IdempotencyTestNodejsFunctionAndDynamoTable(
    testStack,
    {
      function: {
        entry: lambdaFunctionCodeFilePath,
        handler: 'handlerDurable',
        durableConfig,
      },
    },
    {
      nameSuffix: 'durable',
    }
  );

  let functionNamePending: string;
  let tableNamePending: string;
  new IdempotencyTestNodejsFunctionAndDynamoTable(
    testStack,
    {
      function: {
        entry: lambdaFunctionCodeFilePath,
        handler: 'handlerDurablePendingOperation',
        durableConfig,
      },
    },
    {
      nameSuffix: 'pending',
    }
  );

  const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({}));

  /**
   * Starts a durable execution of the function and waits for it to complete.
   */
  const runExecution = async (functionName: string, payload: JSONValue) => {
    const durableExecutionArn = await startDurableExecution({
      functionName: `${functionName}:$LATEST`,
      executionName: randomUUID(),
      payload,
    });
    const execution = await waitForDurableExecution({ durableExecutionArn });
    const events = await getDurableExecutionHistory(durableExecutionArn);

    return { durableExecutionArn, execution, events };
  };

  /**
   * Counts the events of a type in the history of an execution, optionally only those of an operation.
   */
  const countEvents = (events: Event[], eventType: string, name?: string) =>
    events.filter(
      (event) =>
        event.EventType === eventType &&
        (name === undefined || event.Name === name)
    ).length;

  /**
   * Gets the idempotency record that the function stores for a payload.
   */
  const getRecord = async (
    tableName: string,
    functionName: string,
    payload: JSONValue
  ) => {
    const payloadHash = createHash('md5')
      .update(JSON.stringify(deepSort(payload)))
      .digest('base64');
    const { Item } = await ddb.send(
      new GetCommand({
        TableName: tableName,
        Key: { id: `${functionName}#${payloadHash}` },
        ConsistentRead: true,
      })
    );

    return Item;
  };

  beforeAll(async () => {
    // Deploy the stack
    await testStack.deploy();

    // Get the actual function names from the stack outputs
    functionNameDurable = testStack.findAndGetStackOutputValue('durableFn');
    tableNameDurable = testStack.findAndGetStackOutputValue('durableTable');
    functionNamePending = testStack.findAndGetStackOutputValue('pendingFn');
    tableNamePending = testStack.findAndGetStackOutputValue('pendingTable');
  });

  it('returns the stored result to a later execution with the same payload', async () => {
    // Prepare
    const payload = { testCase: 'sequential' };

    // Act
    const first = await runExecution(functionNameDurable, payload);
    const record = await getRecord(
      tableNameDurable,
      functionNameDurable,
      payload
    );
    const second = await runExecution(functionNameDurable, payload);

    // Assess
    expect(first.execution.Status).toBe('SUCCEEDED');
    // The function runs its step once, and is replayed after the wait
    expect(countEvents(first.events, 'StepSucceeded', 'generate-id')).toBe(1);
    expect(countEvents(first.events, 'InvocationCompleted')).toBe(2);
    expect(
      countEvents(first.events, 'StepSucceeded', 'powertools-idempotency-save')
    ).toBe(1);
    expect(record).toEqual(
      expect.objectContaining({
        status: 'COMPLETED',
        data: JSON.parse(first.execution.Result as string),
        owner: first.durableExecutionArn,
      })
    );
    expect(record).not.toHaveProperty('in_progress_expiration');
    expect(second.execution.Status).toBe('SUCCEEDED');
    expect(second.execution.Result).toBe(first.execution.Result);
    expect(countEvents(second.events, 'StepStarted')).toBe(0);
    expect(countEvents(second.events, 'InvocationCompleted')).toBe(1);
  });

  it('rejects an execution with the same payload while another one is suspended', async () => {
    // Prepare
    const payload = { testCase: 'concurrent', waitSeconds: 20 };
    const firstArn = await startDurableExecution({
      functionName: `${functionNameDurable}:$LATEST`,
      executionName: randomUUID(),
      payload,
    });
    await vi.waitFor(
      async () => {
        const events = await getDurableExecutionHistory(firstArn);
        expect(countEvents(events, 'InvocationCompleted')).toBe(1);
      },
      { timeout: 30_000, interval: 1_000 }
    );

    // Act
    const recordWhileSuspended = await getRecord(
      tableNameDurable,
      functionNameDurable,
      payload
    );
    const second = await runExecution(functionNameDurable, payload);
    const first = await waitForDurableExecution({
      durableExecutionArn: firstArn,
    });
    const third = await runExecution(functionNameDurable, payload);

    // Assess
    expect(recordWhileSuspended).toEqual(
      expect.objectContaining({ status: 'INPROGRESS', owner: firstArn })
    );
    expect(second.execution.Status).toBe('FAILED');
    expect(second.execution.Error?.ErrorType).toBe(
      'IdempotencyAlreadyInProgressError'
    );
    expect(first.Status).toBe('SUCCEEDED');
    expect(third.execution.Status).toBe('SUCCEEDED');
    expect(third.execution.Result).toBe(first.Result);
  });

  it('deletes the record when the durable execution fails', async () => {
    // Prepare
    const payload = { testCase: 'failure', fail: true };

    // Act
    const { execution } = await runExecution(functionNameDurable, payload);

    // Assess
    expect(execution.Status).toBe('FAILED');
    expect(execution.Error?.ErrorMessage).toMatch(/^Failed to process /);
    expect(
      await getRecord(tableNameDurable, functionNameDurable, payload)
    ).toBeUndefined();
  });

  it.each([
    {
      case: 'returns',
      fail: false,
      status: 'SUCCEEDED',
      record: expect.objectContaining({ status: 'COMPLETED' }),
    },
    {
      case: 'throws',
      fail: true,
      status: 'FAILED',
      record: undefined,
    },
  ])(
    'completes the execution in one invocation when the function $case with a pending operation',
    async ({ fail, status, record }) => {
      // Prepare
      const payload = { testCase: 'pending', fail };

      // Act
      const { execution, events } = await runExecution(
        functionNamePending,
        payload
      );

      // Assess
      expect(execution.Status).toBe(status);
      expect(countEvents(events, 'InvocationCompleted')).toBe(1);
      expect(
        await getRecord(tableNamePending, functionNamePending, payload)
      ).toEqual(record);
    }
  );

  afterAll(async () => {
    if (!process.env.DISABLE_TEARDOWN) {
      await testStack.destroy();
    }
  });
});

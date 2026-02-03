import { join } from 'node:path';
import { LogTailer, TestStack } from '@aws-lambda-powertools/testing-utils';
import { TestNodejsFunction } from '@aws-lambda-powertools/testing-utils/resources/lambda';
import type { ParsedLog } from '@aws-lambda-powertools/testing-utils/types';
import { CfnOutput, Duration, RemovalPolicy } from 'aws-cdk-lib';
import { LoggingFormat } from 'aws-cdk-lib/aws-lambda';
import { SqsEventSource } from 'aws-cdk-lib/aws-lambda-event-sources';
import { Queue } from 'aws-cdk-lib/aws-sqs';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { sendMessagesToQueue } from '../helpers/publishers.js';
import { RESOURCE_NAME_PREFIX } from './constants.js';

const lambdaFunctionCodeFilePath = join(
  __dirname,
  'sqsStandard.test.FunctionCode.ts'
);

describe('SQS Standard Queue Batch Processing', () => {
  const testName = 'SqsStandard';
  const testStack = new TestStack({
    stackNameProps: {
      stackNamePrefix: RESOURCE_NAME_PREFIX,
      testName,
    },
  });

  let logGroupArn: string;
  let queueUrl: string;

  const lambdaFunction = new TestNodejsFunction(
    testStack,
    {
      entry: lambdaFunctionCodeFilePath,
      environment: {
        POWERTOOLS_SERVICE_NAME: 'batch-e2e-test',
      },
      loggingFormat: LoggingFormat.JSON,
    },
    {
      nameSuffix: 'fn',
    }
  );
  new CfnOutput(testStack.stack, 'LogGroupArn', {
    value: lambdaFunction.logGroup.logGroupArn,
  });

  const queue = new Queue(testStack.stack, 'BatchTestQueue', {
    removalPolicy: RemovalPolicy.DESTROY,
    deadLetterQueue: {
      queue: new Queue(testStack.stack, 'BatchTestDLQ', {
        removalPolicy: RemovalPolicy.DESTROY,
      }),
      maxReceiveCount: 1,
    },
  });
  lambdaFunction.addEventSource(
    new SqsEventSource(queue, {
      batchSize: 10,
      reportBatchItemFailures: true,
      maxConcurrency: 2,
      maxBatchingWindow: Duration.seconds(10),
    })
  );
  new CfnOutput(testStack.stack, 'BatchTestQueueUrl', {
    value: queue.queueUrl,
  });

  beforeAll(async () => {
    await testStack.deploy();

    logGroupArn = testStack.findAndGetStackOutputValue('LogGroupArn');
    queueUrl = testStack.findAndGetStackOutputValue('BatchTestQueueUrl');
  });

  it('processes mixed success and failure messages correctly', async () => {
    const logTailer = new LogTailer(logGroupArn);

    const requestsLogs = await logTailer.collectLogs({
      testFn: async () => {
        await sendMessagesToQueue(queueUrl, [
          { message: 'success-1', shouldFail: false },
          { message: 'failure-1', shouldFail: true },
          { message: 'success-2', shouldFail: false },
          { foo: 'bar' }, // shouldFail undefined, treated as failure
        ]);
      },
      waitForIdle: true,
    });

    const logs = {
      messagesIdToFail: [] as string[],
      messagesIdToSucceed: [] as string[],
      response: { batchItemFailures: [] as Array<{ itemIdentifier: string }> },
    };
    for (const logEntries of requestsLogs.values()) {
      const messageLog = logEntries.find(
        (entry: ParsedLog) => entry.message === 'messages'
      );
      (messageLog as { messagesWillFail: string[] }).messagesWillFail.forEach(
        (id: string) => {
          logs.messagesIdToFail.push(id);
        }
      );
      (
        messageLog as { messagesWillSucceed: string[] }
      ).messagesWillSucceed.forEach((id: string) => {
        logs.messagesIdToSucceed.push(id);
      });
      const responseLog = logEntries.find(
        (entry: ParsedLog) => entry.message === 'response'
      );
      logs.response.batchItemFailures.push(
        ...(
          responseLog as {
            batchItemFailures: Array<{ itemIdentifier: string }>;
          }
        ).batchItemFailures
      );
    }

    expect(logs.messagesIdToFail.length).toBe(2);
    expect(logs.messagesIdToSucceed.length).toBe(2);
    expect(logs.response.batchItemFailures.length).toBe(2);
    expect(logs.response.batchItemFailures).toEqual([
      { itemIdentifier: logs.messagesIdToFail[0] },
      { itemIdentifier: logs.messagesIdToFail[1] },
    ]);
  });

  afterAll(async () => {
    if (!process.env.DISABLE_TEARDOWN) {
      await testStack.destroy();
    }
  });
});

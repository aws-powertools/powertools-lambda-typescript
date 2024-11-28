import type { Context } from 'aws-lambda';
import { describe, expect, it } from 'vitest';
declare const handler: (event: unknown, context: Context) => Promise<true>;

const context = {
  callbackWaitsForEmptyEventLoop: true,
  functionVersion: '$LATEST',
  functionName: 'foo-bar-function',
  memoryLimitInMB: '128',
  logGroupName: '/aws/lambda/foo-bar-function-123456abcdef',
  logStreamName: '2021/03/09/[$LATEST]abcdef123456abcdef123456abcdef123456',
  invokedFunctionArn:
    'arn:aws:lambda:eu-west-1:123456789012:function:foo-bar-function',
  awsRequestId: 'c6af9ac6-7b61-11e6-9a41-93e812345678',
  getRemainingTimeInMillis: () => 1234,
  done: () => console.log('Done!'),
  fail: () => console.log('Failed!'),
  succeed: () => console.log('Succeeded!'),
} satisfies Context;

describe('MyUnitTest', () => {
  it('invokes the handler successfully', async () => {
    // Prepare
    const testEvent = { test: 'test' };

    // Act
    const result = await handler(testEvent, context);

    // Assert
    expect(result).toBe(true);
  });
});

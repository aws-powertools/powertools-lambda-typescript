declare const handler: (event: unknown, context: unknown) => Promise<void>;

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
};

describe('MyUnitTest', () => {
  test('Lambda invoked successfully', async () => {
    const testEvent = { test: 'test' };
    await handler(testEvent, context);
  });
});

import { Context } from 'aws-lambda';

const helloworldContext: Context = {
  callbackWaitsForEmptyEventLoop: true,
  functionVersion: '$LATEST',
  functionName: 'foo-bar-function',
  memoryLimitInMB: '128',
  logGroupName: '/aws/lambda/foo-bar-function-123456abcdef',
  logStreamName: '2021/03/09/[$LATEST]abcdef123456abcdef123456abcdef123456',
  invokedFunctionArn: 'arn:aws:lambda:eu-central-1:123456789012:function:Example',
  awsRequestId: 'c6af9ac6-7b61-11e6-9a41-93e8deadbeef',
  getRemainingTimeInMillis: () => 1234,
  done: () => console.log('Done!'),
  fail: () => console.log('Failed!'),
  succeed: () => console.log('Succeeded!'),
};

export {
  helloworldContext,
};
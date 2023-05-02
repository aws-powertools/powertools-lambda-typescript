import { ContextExamples as dummyContext } from '@aws-lambda-powertools/commons';
import { handler } from './basicUsage';

describe('MyUnitTest', () => {
  test('Lambda invoked successfully', async () => {
    const testEvent = { test: 'test' };
    await handler(testEvent, dummyContext);
  });
});

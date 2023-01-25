import { ContextExamples as dummyContext } from '@aws-lambda-powertools/commons';

describe('MyUnitTest', () => {

  test('Lambda invoked successfully', async () => {
    
    const testEvent = { test: 'test' };
    await handler(testEvent, dummyContext);

  });

});
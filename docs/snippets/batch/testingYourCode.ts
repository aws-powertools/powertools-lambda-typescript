import { ContextExamples as dummyContext } from '@aws-lambda-powertools/commons';
import { handler, processor } from './gettingStartedSQS';
import sqsEvent from './samples/sampleSQSEvent.json';

describe('Function tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should return one failed message', async () => {
    // Prepare
    const context = dummyContext.helloworldContext;
    const processorResult = processor; // access processor for additional assertions
    const successfulRecord = sqsEvent.Records[0];
    const failedRecord = sqsEvent.Records[1];
    const expectedResponse = {
      batchItemFailures: [
        {
          itemIdentifier: failedRecord.messageId,
        },
      ],
    };

    // Act
    const response = await handler(sqsEvent, context);

    // Assess
    expect(response).toEqual(expectedResponse);
    expect(processorResult.failureMessages).toHaveLength(1);
    expect(processorResult.successMessages[0]).toEqual(successfulRecord);
  });
});

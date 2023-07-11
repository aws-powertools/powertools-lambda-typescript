/**
 * Test processPartialResponse function
 *
 * @group unit/batch/function/processpartialresponse
 */

import { BatchProcessor, EventType, processPartialResponse } from '../../src';
import { sqsEventFactory } from '../../tests/helpers/factories';
import { sqsRecordHandler } from '../../tests/helpers/handlers';

describe('Function: processPartialResponse()', () => {
  const ENVIRONMENT_VARIABLES = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();
    process.env = { ...ENVIRONMENT_VARIABLES };
  });

  afterAll(() => {
    process.env = ENVIRONMENT_VARIABLES;
  });

  test('Process partial response for SQS records with no failures', async () => {
    // Prepare
    const records = [sqsEventFactory('success'), sqsEventFactory('success')];
    const batch = { Records: records };
    const processor = new BatchProcessor(EventType.SQS);

    // Act
    const ret = await processPartialResponse(
      batch,
      sqsRecordHandler,
      processor
    );

    // Assess
    expect(ret).toStrictEqual({ batchItemFailures: [] });
  });
});

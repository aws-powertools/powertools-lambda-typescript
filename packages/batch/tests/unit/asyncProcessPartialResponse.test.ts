/**
 * Test processPartialResponse function
 *
 * @group unit/batch/function/processpartialresponse
 */
import type { Context, SQSEvent } from 'aws-lambda';
import { helloworldContext as dummyContext } from '../../../commons/src/samples/resources/contexts';
import { Custom as dummyEvent } from '../../../commons/src/samples/resources/events';
import { AsyncBatchProcessor, asyncProcessPartialResponse } from '../../src';
import { EventType } from '../../src/constants';
import type { PartialItemFailureResponse } from '../../src/types';
import { sqsRecordFactory } from '../helpers/factories';
import { asyncSqsRecordHandler } from '../helpers/handlers';

describe('Function: processPartialResponse()', () => {
  const ENVIRONMENT_VARIABLES = process.env;
  const context = dummyContext;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();
    process.env = { ...ENVIRONMENT_VARIABLES };
  });

  afterAll(() => {
    process.env = ENVIRONMENT_VARIABLES;
  });

  describe('Process partial response function call tests', () => {
    test('Process partial response function call with asynchronous handler', async () => {
      // Prepare
      const records = [
        sqsRecordFactory('success'),
        sqsRecordFactory('success'),
      ];
      const batch = { Records: records };
      const processor = new AsyncBatchProcessor(EventType.SQS);

      // Act
      const ret = await asyncProcessPartialResponse(
        batch,
        asyncSqsRecordHandler,
        processor
      );

      // Assess
      expect(ret).toStrictEqual({ batchItemFailures: [] });
    });

    test('Process partial response through handler for SQS records with incorrect event type', async () => {
      // Prepare
      const processor = new AsyncBatchProcessor(EventType.SQS);
      const event = dummyEvent;
      const eventTypes: string = Object.values(EventType).toString();

      const handler = async (
        event: SQSEvent,
        _context: Context
      ): Promise<PartialItemFailureResponse> => {
        return await asyncProcessPartialResponse(
          event,
          asyncSqsRecordHandler,
          processor
        );
      };

      // Act & Assess
      await expect(() =>
        handler(event as unknown as SQSEvent, context)
      ).rejects.toThrowError(
        new Error(
          'Failed to convert event to record batch for processing.\nPlease ensure batch event is a valid ' +
            eventTypes +
            ' event.'
        )
      );
    });
  });
});

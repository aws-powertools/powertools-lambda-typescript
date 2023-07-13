/**
 * Test SqsFifoBatchProcessor class
 *
 * @group unit/batch/class/sqsfifobatchprocessor
 */

import { SqsFifoPartialProcessor, processPartialResponse } from '../../src';
import { sqsRecordFactory } from '../../tests/helpers/factories';
import {
  asyncSqsRecordHandler,
  sqsRecordHandler,
} from '../../tests/helpers/handlers';

describe('Class: SqsFifoBatchProcessor', () => {
  const ENVIRONMENT_VARIABLES = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();
    process.env = { ...ENVIRONMENT_VARIABLES };
  });

  afterAll(() => {
    process.env = ENVIRONMENT_VARIABLES;
  });

  describe('Synchronous SQS FIFO batch processing', () => {
    test('SQS FIFO Batch processor with no failures', async () => {
      // Prepare
      const firstRecord = sqsRecordFactory('success');
      const secondRecord = sqsRecordFactory('success');
      const event = { Records: [firstRecord, secondRecord] };
      const processor = new SqsFifoPartialProcessor();

      // Act
      const result = await processPartialResponse(
        event,
        sqsRecordHandler,
        processor
      );

      // Assess
      expect(result['batchItemFailures']).toStrictEqual([]);
    });

    test('SQS FIFO Batch processor with failures', async () => {
      // Prepare
      const firstRecord = sqsRecordFactory('success');
      const secondRecord = sqsRecordFactory('fail');
      const thirdRecord = sqsRecordFactory('success');
      const event = { Records: [firstRecord, secondRecord, thirdRecord] };
      const processor = new SqsFifoPartialProcessor();

      // Act
      const result = await processPartialResponse(
        event,
        sqsRecordHandler,
        processor
      );

      // Assess
      expect(result['batchItemFailures'].length).toBe(2);
      expect(result['batchItemFailures'][0]['itemIdentifier']).toBe(
        secondRecord.messageId
      );
      expect(result['batchItemFailures'][1]['itemIdentifier']).toBe(
        thirdRecord.messageId
      );
    });
  });

  describe('Asynchronous SQS FIFO batch processing', () => {
    test('SQS FIFO Batch processor with no failures', async () => {
      // Prepare
      const firstRecord = sqsRecordFactory('success');
      const secondRecord = sqsRecordFactory('success');
      const event = { Records: [firstRecord, secondRecord] };
      const processor = new SqsFifoPartialProcessor();

      // Act
      const result = await processPartialResponse(
        event,
        asyncSqsRecordHandler,
        processor
      );

      // Assess
      expect(result['batchItemFailures']).toStrictEqual([]);
    });

    test('SQS FIFO Batch processor with failures', async () => {
      // Prepare
      const firstRecord = sqsRecordFactory('success');
      const secondRecord = sqsRecordFactory('fail');
      const thirdRecord = sqsRecordFactory('success');
      const event = { Records: [firstRecord, secondRecord, thirdRecord] };
      const processor = new SqsFifoPartialProcessor();

      // Act
      const result = await processPartialResponse(
        event,
        asyncSqsRecordHandler,
        processor
      );

      // Assess
      expect(result['batchItemFailures'].length).toBe(2);
      expect(result['batchItemFailures'][0]['itemIdentifier']).toBe(
        secondRecord.messageId
      );
      expect(result['batchItemFailures'][1]['itemIdentifier']).toBe(
        thirdRecord.messageId
      );
    });
  });
});

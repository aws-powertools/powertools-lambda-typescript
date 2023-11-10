/**
 * Test SqsFifoBatchProcessor class
 *
 * @group unit/batch/class/sqsfifobatchprocessor
 */
import {
  SqsFifoPartialProcessor,
  processPartialResponseSync,
  SqsFifoShortCircuitError,
} from '../../src/index.js';
import { sqsRecordFactory } from '../helpers/factories.js';
import { sqsRecordHandler } from '../helpers/handlers.js';

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
    test('SQS FIFO Batch processor with no failures', () => {
      // Prepare
      const firstRecord = sqsRecordFactory('success');
      const secondRecord = sqsRecordFactory('success');
      const event = { Records: [firstRecord, secondRecord] };
      const processor = new SqsFifoPartialProcessor();

      // Act
      const result = processPartialResponseSync(
        event,
        sqsRecordHandler,
        processor
      );

      // Assess
      expect(result['batchItemFailures']).toStrictEqual([]);
    });

    test('SQS FIFO Batch processor with failures', () => {
      // Prepare
      const firstRecord = sqsRecordFactory('success');
      const secondRecord = sqsRecordFactory('fail');
      const thirdRecord = sqsRecordFactory('success');
      const event = { Records: [firstRecord, secondRecord, thirdRecord] };
      const processor = new SqsFifoPartialProcessor();

      // Act
      const result = processPartialResponseSync(
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
      expect(processor.errors[1]).toBeInstanceOf(SqsFifoShortCircuitError);
    });
  });
});

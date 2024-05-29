/**
 * Test SqsFifoBatchProcessor class
 *
 * @group unit/batch/class/sqsfifobatchprocessor
 */
import {
  SqsFifoPartialProcessor,
  processPartialResponseSync,
  SqsFifoShortCircuitError,
  SqsFifoMessageGroupShortCircuitError,
} from '../../src/index.js';
import { sqsRecordFactory } from '../helpers/factories.js';
import { sqsRecordHandler } from '../helpers/handlers.js';
import context from '@aws-lambda-powertools/testing-utils/context';

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

    test('When `skipGroupOnError` is true, SQS FIFO processor is set to continue processing even after first failure', () => {
      // Prepare
      const firstRecord = sqsRecordFactory('fail', '1');
      const secondRecord = sqsRecordFactory('success', '1');
      const thirdRecord = sqsRecordFactory('fail', '2');
      const fourthRecord = sqsRecordFactory('success', '2');
      const fifthRecord = sqsRecordFactory('success', '3');
      const event = {
        Records: [
          firstRecord,
          secondRecord,
          thirdRecord,
          fourthRecord,
          fifthRecord,
        ],
      };
      const processor = new SqsFifoPartialProcessor();

      // Act
      const result = processPartialResponseSync(
        event,
        sqsRecordHandler,
        processor,
        {
          context,
          skipGroupOnError: true,
        }
      );

      // Assess
      expect(result['batchItemFailures'].length).toBe(4);
      expect(result['batchItemFailures'][0]['itemIdentifier']).toBe(
        firstRecord.messageId
      );
      expect(result['batchItemFailures'][1]['itemIdentifier']).toBe(
        secondRecord.messageId
      );
      expect(result['batchItemFailures'][2]['itemIdentifier']).toBe(
        thirdRecord.messageId
      );
      expect(result['batchItemFailures'][3]['itemIdentifier']).toBe(
        fourthRecord.messageId
      );
      expect(processor.errors.length).toBe(4);
      expect(processor.errors[1]).toBeInstanceOf(
        SqsFifoMessageGroupShortCircuitError
      );
      expect(processor.errors[3]).toBeInstanceOf(
        SqsFifoMessageGroupShortCircuitError
      );
    });

    test('When `skipGroupOnError` is true, SQS FIFO processor is set to continue processing even after encountering errors in specific MessageGroupID', () => {
      // Prepare
      const firstRecord = sqsRecordFactory('success', '1');
      const secondRecord = sqsRecordFactory('success', '1');
      const thirdRecord = sqsRecordFactory('fail', '2');
      const fourthRecord = sqsRecordFactory('success', '2');
      const fifthRecord = sqsRecordFactory('success', '3');
      const event = {
        Records: [
          firstRecord,
          secondRecord,
          thirdRecord,
          fourthRecord,
          fifthRecord,
        ],
      };
      const processor = new SqsFifoPartialProcessor();

      // Act
      const result = processPartialResponseSync(
        event,
        sqsRecordHandler,
        processor,
        {
          context,
          skipGroupOnError: true,
        }
      );

      // Assess
      expect(result['batchItemFailures'].length).toBe(2);
      expect(result['batchItemFailures'][0]['itemIdentifier']).toBe(
        thirdRecord.messageId
      );
      expect(result['batchItemFailures'][1]['itemIdentifier']).toBe(
        fourthRecord.messageId
      );
      expect(processor.errors.length).toBe(2);
      expect(processor.errors[1]).toBeInstanceOf(
        SqsFifoMessageGroupShortCircuitError
      );
    });

    test('When `skipGroupOnError` is false, SQS FIFO Batch processor short circuits the process on first failure', () => {
      // Prepare
      const firstRecord = sqsRecordFactory('success', '1');
      const secondRecord = sqsRecordFactory('fail', '2');
      const thirdRecord = sqsRecordFactory('success', '3');
      const fourthRecord = sqsRecordFactory('success', '4');
      const event = {
        Records: [firstRecord, secondRecord, thirdRecord, fourthRecord],
      };
      const processor = new SqsFifoPartialProcessor();

      // Act
      const result = processPartialResponseSync(
        event,
        sqsRecordHandler,
        processor,
        {
          context,
          skipGroupOnError: false,
        }
      );

      // Assess
      expect(result['batchItemFailures'].length).toBe(3);
      expect(result['batchItemFailures'][0]['itemIdentifier']).toBe(
        secondRecord.messageId
      );
      expect(result['batchItemFailures'][1]['itemIdentifier']).toBe(
        thirdRecord.messageId
      );
      expect(result['batchItemFailures'][2]['itemIdentifier']).toBe(
        fourthRecord.messageId
      );
      expect(processor.errors.length).toBe(3);
      expect(processor.errors[1]).toBeInstanceOf(SqsFifoShortCircuitError);
    });
  });
});

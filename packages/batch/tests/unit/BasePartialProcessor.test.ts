import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { BasePartialBatchProcessor, EventType } from '../../src/index.js';
import type {
  BaseRecord,
  FailureResponse,
  SuccessResponse,
} from '../../src/types.js';
import { sqsRecordFactory } from '../helpers/factories.js';
import { sqsRecordHandler } from '../helpers/handlers.js';

describe('Class: BasePartialBatchProcessor', () => {
  const ENVIRONMENT_VARIABLES = process.env;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env = { ...ENVIRONMENT_VARIABLES };
  });

  afterAll(() => {
    process.env = ENVIRONMENT_VARIABLES;
  });

  class MyPartialProcessor extends BasePartialBatchProcessor {
    public constructor() {
      super(EventType.SQS);
    }

    public async processRecord(
      _record: BaseRecord
    ): Promise<SuccessResponse | FailureResponse> {
      throw new Error('Not implemented');
    }

    public processRecordSync(
      record: BaseRecord
    ): SuccessResponse | FailureResponse {
      console.log('Processing record');

      return this.successHandler(record, 'success');
    }
  }

  describe('create custom batch partial processor', () => {
    it('creates a custom batch partial processor', () => {
      // Act
      const processor = new MyPartialProcessor();

      // Assess
      expect(processor).toBeInstanceOf(BasePartialBatchProcessor);
    });

    it('processes a batch of records', () => {
      // Prepare
      const processor = new MyPartialProcessor();
      const records = [sqsRecordFactory('success')];
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      // Act
      processor.register(records, sqsRecordHandler);
      const processedMessages = processor.processSync();

      // Assess
      expect(processedMessages).toStrictEqual([
        ['success', records[0].body, records[0]],
      ]);
      expect(consoleSpy).toHaveBeenCalledTimes(1);
    });
  });
});

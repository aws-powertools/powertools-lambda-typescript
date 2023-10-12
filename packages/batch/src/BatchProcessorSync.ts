import { BasePartialBatchProcessor } from './BasePartialBatchProcessor.js';
import { BatchProcessingError } from './errors.js';
import type { BaseRecord, FailureResponse, SuccessResponse } from './types.js';

/**
 * Process native partial responses from SQS, Kinesis Data Streams, and DynamoDB
 */
class BatchProcessorSync extends BasePartialBatchProcessor {
  public async processRecord(
    _record: BaseRecord
  ): Promise<SuccessResponse | FailureResponse> {
    throw new BatchProcessingError('Not implemented. Use process() instead.');
  }

  /**
   * Process a record with instance's handler
   * @param record Batch record to be processed
   * @returns response of success or failure
   */
  public processRecordSync(
    record: BaseRecord
  ): SuccessResponse | FailureResponse {
    try {
      const data = this.toBatchType(record, this.eventType);
      const result = this.handler(data, this.options?.context);

      return this.successHandler(record, result);
    } catch (error) {
      return this.failureHandler(record, error as Error);
    }
  }
}

export { BatchProcessorSync };

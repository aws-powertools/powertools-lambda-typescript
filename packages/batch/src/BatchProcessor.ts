import { BasePartialBatchProcessor } from './BasePartialBatchProcessor';
import type { BaseRecord, FailureResponse, SuccessResponse } from './types';

/**
 * Process native partial responses from SQS, Kinesis Data Streams, and DynamoDB
 */
class BatchProcessor extends BasePartialBatchProcessor {
  public async asyncProcessRecord(
    _record: BaseRecord
  ): Promise<SuccessResponse | FailureResponse> {
    throw new Error('Not implemented. Use process() instead.');
  }

  /**
   * Process a record with instance's handler
   * @param record Batch record to be processed
   * @returns response of success or failure
   */
  public processRecord(record: BaseRecord): SuccessResponse | FailureResponse {
    try {
      const data = this.toBatchType(record, this.eventType);
      const result = this.handler(data, this.options);

      return this.successHandler(record, result);
    } catch (error) {
      return this.failureHandler(record, error as Error);
    }
  }
}

export { BatchProcessor };

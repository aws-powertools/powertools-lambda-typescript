import { BasePartialBatchProcessor } from './BasePartialBatchProcessor.js';
import { BatchProcessingError } from './errors.js';
import type { BaseRecord, FailureResponse, SuccessResponse } from './types.js';

/**
 * Process native partial responses from SQS, Kinesis Data Streams, and DynamoDB
 */
class BatchProcessor extends BasePartialBatchProcessor {
  public async processRecord(
    record: BaseRecord
  ): Promise<SuccessResponse | FailureResponse> {
    try {
      const data = this.toBatchType(record, this.eventType);
      const result = await this.handler(data, this.options?.context);

      return this.successHandler(record, result);
    } catch (error) {
      return this.failureHandler(record, error as Error);
    }
  }

  /**
   * Process a record with instance's handler
   * @param _record Batch record to be processed
   * @returns response of success or failure
   */
  public processRecordSync(
    _record: BaseRecord
  ): SuccessResponse | FailureResponse {
    throw new BatchProcessingError(
      'Not implemented. Use asyncProcess() instead.'
    );
  }
}

export { BatchProcessor };

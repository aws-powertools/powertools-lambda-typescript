import { BasePartialBatchProcessor } from './BasePartialBatchProcessor';
import type { BaseRecord, FailureResponse, SuccessResponse } from './types';

/**
 * Process native partial responses from SQS, Kinesis Data Streams, and DynamoDB
 */
class AsyncBatchProcessor extends BasePartialBatchProcessor {
  public async asyncProcessRecord(
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
   * @param record Batch record to be processed
   * @returns response of success or failure
   */
  public processRecord(_record: BaseRecord): SuccessResponse | FailureResponse {
    throw new Error('Not implemented. Use asyncProcess() instead.');
  }
}

export { AsyncBatchProcessor };

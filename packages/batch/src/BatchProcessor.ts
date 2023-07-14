/**
 * Process native partial responses from SQS, Kinesis Data Streams, and DynamoDB
 */
import {
  BasePartialBatchProcessor,
  BaseRecord,
  FailureResponse,
  SuccessResponse,
} from '.';

class BatchProcessor extends BasePartialBatchProcessor {
  /**
   * Process a record with instance's handler
   * @param record Batch record to be processed
   * @returns response of success or failure
   */
  public async processRecord(
    record: BaseRecord
  ): Promise<SuccessResponse | FailureResponse> {
    try {
      const data = this.toBatchType(record, this.eventType);

      const result = await this.handler(data, this.options);

      return this.successHandler(record, result);
    } catch (e) {
      return this.failureHandler(record, e as Error);
    }
  }
}

export { BatchProcessor };

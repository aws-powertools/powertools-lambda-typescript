import { BasePartialBatchProcessor } from './BasePartialBatchProcessor';
import type {
  EventSourceType,
  FailureResponse,
  SuccessResponse,
} from './types';

/**
 * Synchronously process a batch of records from SQS, Kinesis Data Streams, and DynamoDB and report partial failures
 * using native responses.
 *
 * When processing a batch of records, this processor will handle partial failures and
 * return a response object that can be used to report partial failures and avoid reprocessing
 * the same records.
 *
 * @example
 * ```typescript
 * import {
 *   BatchProcessor,
 *   EventType,
 * } from '@aws-lambda-powertools/batch';
 *
 * const processor = new BatchProcessor(EventType.SQS);
 * ```
 */
class BatchProcessor extends BasePartialBatchProcessor {
  /**
   * Process a record asynchronously using the provided handler.
   *
   * Throws an error if called on an async processor. Please use `processRecord()` instead.
   */
  public async asyncProcessRecord(
    _record: EventSourceType
  ): Promise<SuccessResponse | FailureResponse> {
    throw new Error('Not implemented. Use process() instead.');
  }

  /**
   * Process a record synchronously using the provided handler.
   *
   * @param record Record to process within the batch
   */
  public processRecord(
    record: EventSourceType
  ): SuccessResponse | FailureResponse {
    try {
      const result = this.handler(record, this.options?.context);

      return this.successHandler(record, result);
    } catch (error) {
      return this.failureHandler(record, error as Error);
    }
  }
}

export { BatchProcessor };

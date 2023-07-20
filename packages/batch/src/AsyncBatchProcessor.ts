import { BasePartialBatchProcessor } from './BasePartialBatchProcessor';
import type {
  EventSourceType,
  FailureResponse,
  SuccessResponse,
} from './types';

/**
 * Asynchronously process a batch of records from SQS, Kinesis Data Streams, and DynamoDB and report partial failures
 * using native responses.
 *
 * When processing a batch of records, this processor will handle partial failures and
 * return a response object that can be used to report partial failures and avoid reprocessing
 * the same records.
 *
 * @example
 * ```typescript
 * import {
 *   AsyncBatchProcessor,
 *   EventType,
 * } from '@aws-lambda-powertools/batch';
 *
 * const processor = new AsyncBatchProcessor(EventType.SQS);
 * ```
 */
class AsyncBatchProcessor extends BasePartialBatchProcessor {
  /**
   * Process a record asynchronously using the provided handler.
   *
   * @param record Record in the batch to be processed
   */
  public async asyncProcessRecord(
    record: EventSourceType
  ): Promise<SuccessResponse | FailureResponse> {
    try {
      const result = await this.handler(record, this.options?.context);

      return this.successHandler(record, result);
    } catch (error) {
      return this.failureHandler(record, error as Error);
    }
  }

  /**
   * Process a record synchronously using the provided handler.
   *
   * Throws an error if called on an async processor. Please use `asyncProcessRecord()` instead.
   */
  public processRecord(
    _record: EventSourceType
  ): SuccessResponse | FailureResponse {
    throw new Error('Not implemented. Use asyncProcess() instead.');
  }
}

export { AsyncBatchProcessor };

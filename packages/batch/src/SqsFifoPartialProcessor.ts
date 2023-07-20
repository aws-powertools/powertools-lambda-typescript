import { BatchProcessor } from './BatchProcessor';
import { EventType } from './constants';
import type { FailureResponse, SuccessResponse } from './types';

/**
 * Process a batch of records from SQS FIFO queues and report partial failures using native responses.
 *
 * When processing a batch of records, this processor will mark records as failed when the first failure is detected.
 * This is done to preserve the order of messages in the FIFO queue.
 *
 * @example
 * ```typescript
 * import {
 *   SqsFifoPartialProcessor,
 * } from '@aws-lambda-powertools/batch';
 *
 * const processor = new SqsFifoPartialProcessor();
 * ```
 */
class SqsFifoPartialProcessor extends BatchProcessor {
  public constructor() {
    super(EventType.SQS);
  }

  /**
   * Process a batch of records synchronously.
   *
   * Since this is a FIFO processor, it will stop processing records when the first record fails.
   */
  public process(): (SuccessResponse | FailureResponse)[] {
    this.prepare();

    const processedRecords: (SuccessResponse | FailureResponse)[] = [];
    for (const [index, record] of this.records.entries()) {
      // If we have any failed messages, it means the last message failed
      // We should then short circuit the process and fail remaining messages
      if (this.failureMessages.length > 0) {
        return this.shortCircuitProcessing(index, processedRecords);
      }

      processedRecords.push(this.processRecord(record));
    }

    this.clean();

    return processedRecords;
  }

  /**
   * Short circuit processing of remaining messages when the first failure is detected.
   *
   * Starting from the index of the first failure, mark all remaining messages as failed.
   *
   * @param firstFailureIndex Index of the first failed message
   */
  public shortCircuitProcessing(
    firstFailureIndex: number,
    processedRecords: (SuccessResponse | FailureResponse)[]
  ): (SuccessResponse | FailureResponse)[] {
    const remainingRecords = this.records.slice(firstFailureIndex);

    for (const record of remainingRecords) {
      processedRecords.push(
        this.failureHandler(
          record,
          new Error('A previous record failed processing')
        )
      );
    }

    this.clean();

    return processedRecords;
  }
}

export { SqsFifoPartialProcessor };

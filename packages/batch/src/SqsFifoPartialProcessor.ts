import { BatchProcessorSync } from './BatchProcessorSync.js';
import { EventType } from './constants.js';
import { SqsFifoShortCircuitError } from './errors.js';
import type { FailureResponse, SuccessResponse } from './types.js';

/**
 * Batch processor for SQS FIFO queues
 *
 * This class extends the {@link BatchProcessorSync} class and provides
 * a mechanism to process records from SQS FIFO queues synchronously.
 *
 * By default, we will stop processing at the first failure and mark unprocessed messages as failed to preserve ordering.
 *
 * However, this behavior may not be optimal for customers who wish to proceed with processing messages from a different group ID.
 *
 * @example
 * ```typescript
 * import {
 *   BatchProcessor,
 *   EventType,
 *   processPartialResponseSync,
 * } from '@aws-lambda-powertools/batch';
 * import type { SQSRecord, SQSHandler } from 'aws-lambda';
 *
 * const processor = new BatchProcessor(EventType.SQS);
 *
 * const recordHandler = async (record: SQSRecord): Promise<void> => {
 *   const payload = JSON.parse(record.body);
 * };
 *
 * export const handler: SQSHandler = async (event, context) =>
 *   processPartialResponseSync(event, recordHandler, processor, {
 *     context,
 *   });
 * ```
 */
class SqsFifoPartialProcessor extends BatchProcessorSync {
  public constructor() {
    super(EventType.SQS);
  }

  /**
   * Process a record with a synchronous handler
   *
   * This method orchestrates the processing of a batch of records synchronously
   * for SQS FIFO queues.
   *
   * The method calls the prepare hook to initialize the processor and then
   * iterates over each record in the batch, processing them one by one.
   *
   * If one of them fails, the method short circuits the processing and fails
   * the remaining records in the batch.
   *
   * Then, it calls the clean hook to clean up the processor and returns the
   * processed records.
   */
  public processSync(): (SuccessResponse | FailureResponse)[] {
    this.prepare();

    const processedRecords: (SuccessResponse | FailureResponse)[] = [];
    let currentIndex = 0;
    for (const record of this.records) {
      // If we have any failed messages, it means the last message failed
      // We should then short circuit the process and fail remaining messages
      if (this.failureMessages.length != 0) {
        return this.shortCircuitProcessing(currentIndex, processedRecords);
      }

      processedRecords.push(this.processRecordSync(record));
      currentIndex++;
    }

    this.clean();

    return processedRecords;
  }

  /**
   * Starting from the first failure index, fail all remaining messages regardless
   * of their group ID.
   *
   * This short circuit mechanism is used when we detect a failed message in the batch.
   *
   * Since messages in a FIFO queue are processed in order, we must stop processing any
   * remaining messages in the batch to prevent out-of-order processing.
   *
   * @param firstFailureIndex Index of first message that failed
   * @param processedRecords Array of response items that have been processed both successfully and unsuccessfully
   */
  protected shortCircuitProcessing(
    firstFailureIndex: number,
    processedRecords: (SuccessResponse | FailureResponse)[]
  ): (SuccessResponse | FailureResponse)[] {
    const remainingRecords = this.records.slice(firstFailureIndex);

    for (const record of remainingRecords) {
      const data = this.toBatchType(record, this.eventType);
      processedRecords.push(
        this.failureHandler(data, new SqsFifoShortCircuitError())
      );
    }

    this.clean();

    return processedRecords;
  }
}

export { SqsFifoPartialProcessor };

import type { SQSRecord } from 'aws-lambda';
import { BatchProcessor } from './BatchProcessor.js';
import { SqsFifoProcessingUtils } from './SqsFifoProcessingUtils.js';
import { EventType } from './constants.js';
import {
  type BatchProcessingError,
  SqsFifoMessageGroupShortCircuitError,
  SqsFifoShortCircuitError,
} from './errors.js';
import type {
  BaseRecord,
  EventSourceDataClassTypes,
  FailureResponse,
  SuccessResponse,
} from './types.js';

/**
 * Batch processor for SQS FIFO queues
 *
 * This class extends the {@link BatchProcessor} class and provides
 * a mechanism to process records from SQS FIFO queues asynchronously.
 *
 * By default, we will stop processing at the first failure and mark unprocessed messages as failed to preserve ordering.
 *
 * However, this behavior may not be optimal for customers who wish to proceed with processing messages from a different group ID.
 *
 * @example
 * ```typescript
 * import {
 *   BatchProcessor,
 *   SqsFifoPartialProcessorAsync,
 *   processPartialResponse,
 * } from '@aws-lambda-powertools/batch';
 * import type { SQSRecord, SQSHandler } from 'aws-lambda';
 *
 * const processor = new SqsFifoPartialProcessorAsync();
 *
 * const recordHandler = async (record: SQSRecord): Promise<void> => {
 *   const payload = JSON.parse(record.body);
 * };
 *
 * export const handler: SQSHandler = async (event, context) =>
 *   processPartialResponse(event, recordHandler, processor, {
 *     context,
 *   });
 * ```
 */
class SqsFifoPartialProcessorAsync extends BatchProcessor {
  /**
   * Utility class for processing SQS FIFO queues
   */
  readonly #utils: SqsFifoProcessingUtils;

  public constructor() {
    super(EventType.SQS);
    this.#utils = new SqsFifoProcessingUtils();
  }

  /**
   * Handles a failure for a given record.
   * Adds the current group ID to the set of failed group IDs if `skipGroupOnError` is true.
   * @param record - The record that failed.
   * @param exception - The error that occurred.
   * @returns The failure response.
   */
  public failureHandler(
    record: EventSourceDataClassTypes,
    exception: Error
  ): FailureResponse {
    this.#utils.processFailureForCurrentGroup(this.options);

    return super.failureHandler(record, exception);
  }

  /**
   * Process a record with a asynchronous handler
   *
   * This method orchestrates the processing of a batch of records asynchronously
   * for SQS FIFO queues.
   *
   * The method calls the prepare hook to initialize the processor and then
   * iterates over each record in the batch, processing them one by one.
   *
   * If one of them fails and `skipGroupOnError` is not true, the method short circuits
   * the processing and fails the remaining records in the batch.
   *
   * If one of them fails and `skipGroupOnError` is true, then the method fails the current record
   * if the message group has any previous failure, otherwise keeps processing.
   *
   * Then, it calls the clean hook to clean up the processor and returns the
   * processed records.
   */
  public async process(): Promise<(SuccessResponse | FailureResponse)[]> {
    this.prepare();

    const processedRecords: (SuccessResponse | FailureResponse)[] = [];
    let currentIndex = 0;
    for (const record of this.records) {
      this.#utils.setCurrentGroup(
        (record as SQSRecord).attributes?.MessageGroupId
      );

      if (this.#utils.shouldShortCircuit(this.failureMessages, this.options)) {
        return this.shortCircuitProcessing(currentIndex, processedRecords);
      }

      const result = this.#utils.shouldSkipCurrentGroup(this.options)
        ? this.#processFailRecord(
            record,
            new SqsFifoMessageGroupShortCircuitError()
          )
        : await this.processRecord(record);

      processedRecords.push(result);
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
      this.#processFailRecord(record, new SqsFifoShortCircuitError());
    }

    this.clean();

    return processedRecords;
  }

  /**
   * Processes a fail record.
   *
   * @param record - The record that failed.
   * @param exception - The error that occurred.
   */
  #processFailRecord(
    record: BaseRecord,
    exception: BatchProcessingError
  ): FailureResponse {
    const data = this.toBatchType(record, this.eventType);

    return this.failureHandler(data, exception);
  }
}

export { SqsFifoPartialProcessorAsync };

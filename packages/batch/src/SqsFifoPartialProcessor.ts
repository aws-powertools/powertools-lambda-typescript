import { BatchProcessorSync } from './BatchProcessorSync.js';
import { EventType } from './constants.js';
import { SqsFifoShortCircuitError } from './errors.js';
import type { FailureResponse, SuccessResponse } from './types.js';

/**
 * Process native partial responses from SQS FIFO queues
 * Stops processing records when the first record fails
 * The remaining records are reported as failed items
 */
class SqsFifoPartialProcessor extends BatchProcessorSync {
  public constructor() {
    super(EventType.SQS);
  }

  /**
   * Call instance's handler for each record.
   * When the first failed message is detected, the process is short-circuited
   * And the remaining messages are reported as failed items
   */
  public processSync(): (SuccessResponse | FailureResponse)[] {
    this.prepare();

    const processedRecords: (SuccessResponse | FailureResponse)[] = [];
    let currentIndex = 0;
    for (const record of this.records) {
      // If we have any failed messages, it means the last message failed.
      // We should then short circuit the process and
      // fail remaining messages(unless skipGroupOnError is set to true)
      const shouldShortCircuit =
        !this.options?.skipGroupOnError && this.failureMessages.length !== 0;
      if (shouldShortCircuit) {
        return this.shortCircuitProcessing(currentIndex, processedRecords);
      }

      processedRecords.push(this.processRecordSync(record));
      currentIndex++;
    }

    this.clean();

    return processedRecords;
  }

  /**
   * Starting from the first failure index, fail all remaining messages and append them to the result list
   * @param firstFailureIndex Index of first message that failed
   * @param result List of success and failure responses with remaining messages failed
   */
  public shortCircuitProcessing(
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

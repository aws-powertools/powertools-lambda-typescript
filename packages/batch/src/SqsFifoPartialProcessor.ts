import { SQSRecord } from 'aws-lambda';
import { BatchProcessorSync } from './BatchProcessorSync.js';
import { EventType } from './constants.js';
import {
  BatchProcessingError,
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
 * Process native partial responses from SQS FIFO queues
 * If `skipGroupOnError` is not enabled, stop processing records
 * when the first record fails and the remaining records are reported as failed items.
 * If `skipGroupOnError` is true, skip processing of subsequent records
 * in the same message group after the first failure in that group.
 */
class SqsFifoPartialProcessor extends BatchProcessorSync {
  /**
   * The ID of the current message group being processed.
   */
  private currentGroupId?: string;
  /**
   * A set of group IDs that have already encountered failures.
   */
  private failedGroupIds: Set<string>;

  public constructor() {
    super(EventType.SQS);
    this.failedGroupIds = new Set<string>();
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
    if (this.options?.skipGroupOnError && this.currentGroupId) {
      this.addToFailedGroup(this.currentGroupId);
    }

    return super.failureHandler(record, exception);
  }

  /**
   * Call instance's handler for each record.
   * When the first failed message is detected, the process is short-circuited
   * And the remaining messages are reported as failed items,
   * unless the `skipGroupOnError` option is true.
   */
  public processSync(): (SuccessResponse | FailureResponse)[] {
    this.prepare();

    const processedRecords: (SuccessResponse | FailureResponse)[] = [];
    let currentIndex = 0;
    for (const record of this.records) {
      this.setCurrentGroup((record as SQSRecord).attributes?.MessageGroupId);

      // If we have any failed messages, we should then short circuit the process and
      // fail remaining messages unless `skipGroupOnError` is true
      const shouldShortCircuit =
        !this.options?.skipGroupOnError && this.failureMessages.length !== 0;
      if (shouldShortCircuit) {
        return this.shortCircuitProcessing(currentIndex, processedRecords);
      }

      // If `skipGroupOnError` is true and the current group has previously failed,
      // then we should skip processing the current group.
      const shouldSkipCurrentGroup =
        this.options?.skipGroupOnError &&
        this.currentGroupId &&
        this.failedGroupIds.has(this.currentGroupId);

      const result = shouldSkipCurrentGroup
        ? this.processFailRecord(
            record,
            new SqsFifoMessageGroupShortCircuitError()
          )
        : this.processRecordSync(record);

      processedRecords.push(result);
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
      this.processFailRecord(record, new SqsFifoShortCircuitError());
    }

    this.clean();

    return processedRecords;
  }

  /**
   * Adds the specified group ID to the set of failed group IDs.
   * @param group - The group ID to be added to the set of failed group IDs.
   */
  private addToFailedGroup(group: string): void {
    this.failedGroupIds.add(group);
  }

  /**
   * Processes a fail record.
   * @param record - The record that failed.
   * @param exception - The error that occurred.
   * @returns The failure response.
   */
  private processFailRecord(
    record: BaseRecord,
    exception: BatchProcessingError
  ): FailureResponse {
    const data = this.toBatchType(record, this.eventType);

    return this.failureHandler(data, exception);
  }

  /**
   * Sets the current group ID for the message being processed.
   * @param group - The group ID of the current message being processed.
   */
  private setCurrentGroup(group?: string): void {
    this.currentGroupId = group;
  }
}

export { SqsFifoPartialProcessor };

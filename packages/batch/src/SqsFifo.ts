import type { BatchProcessor } from './BatchProcessor.js';
import type { BatchProcessorSync } from './BatchProcessorSync.js';
import {
  type BatchProcessingError,
  SqsFifoShortCircuitError,
} from './errors.js';
import type {
  BaseRecord,
  EventSourceDataClassTypes,
  FailureResponse,
  SuccessResponse,
} from './types.js';

/**
 * A type alias for a generic constructor function.
 * @template T - The type of the instance that the constructor creates.
 */
// biome-ignore lint/suspicious/noExplicitAny: This is a generic type that is intentionally open
type GenericConstructor<T> = new (...args: any[]) => T;

export function SqsFifo<
  TBase extends GenericConstructor<BatchProcessor & BatchProcessorSync>,
>(Base: TBase) {
  return class extends Base {
    /**
     * The ID of the current message group being processed.
     */
    _currentGroupId?: string;
    /**
     * A set of group IDs that have already encountered failures.
     */
    _failedGroupIds: Set<string>;

    // biome-ignore lint/suspicious/noExplicitAny:
    public constructor(...args: any[]) {
      super(...args);
      this._failedGroupIds = new Set<string>();
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
      if (this.options?.skipGroupOnError && this._currentGroupId) {
        this._addToFailedGroup(this._currentGroupId);
      }

      return super.failureHandler(record, exception);
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
    _shortCircuitProcessing(
      firstFailureIndex: number,
      processedRecords: (SuccessResponse | FailureResponse)[]
    ): (SuccessResponse | FailureResponse)[] {
      const remainingRecords = this.records.slice(firstFailureIndex);

      for (const record of remainingRecords) {
        this._processFailRecord(record, new SqsFifoShortCircuitError());
      }

      this.clean();

      return processedRecords;
    }

    /**
     * Adds the specified group ID to the set of failed group IDs.
     *
     * @param group - The group ID to be added to the set of failed group IDs.
     */
    _addToFailedGroup(group: string): void {
      this._failedGroupIds.add(group);
    }

    /**
     * Processes a fail record.
     *
     * @param record - The record that failed.
     * @param exception - The error that occurred.
     */
    _processFailRecord(
      record: BaseRecord,
      exception: BatchProcessingError
    ): FailureResponse {
      const data = this.toBatchType(record, this.eventType);

      return this.failureHandler(data, exception);
    }

    /**
     * Sets the current group ID for the message being processed.
     *
     * @param group - The group ID of the current message being processed.
     */
    _setCurrentGroup(group?: string): void {
      this._currentGroupId = group;
    }

    /**
     * Determines whether the current group should be short-circuited.
     *
     * If we have any failed messages, we should then short circuit the process and
     * fail remaining messages unless `skipGroupOnError` is true
     */
    _shouldShortCircuit(): boolean {
      return (
        !this.options?.skipGroupOnError && this.failureMessages.length !== 0
      );
    }

    /**
     * Determines whether the current group should be skipped.
     *
     * If `skipGroupOnError` is true and the current group has previously failed,
     * then we should skip processing the current group.
     */
    _shouldSkipCurrentGroup(): boolean {
      return (
        (this.options?.skipGroupOnError ?? false) &&
        this._currentGroupId &&
        this._failedGroupIds.has(this._currentGroupId)
      );
    }
  };
}

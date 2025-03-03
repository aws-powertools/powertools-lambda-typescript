import type {
  BatchProcessingOptions,
  EventSourceDataClassTypes,
} from './types.js';

/**
 * Class representing a processor for SQS FIFO messages.
 * This class provides utilities for handling message groups, including tracking failed groups,
 * determining whether to short-circuit processing, and skipping groups based on processing options.
 */
class SqsFifoProcessor {
  /**
   * The ID of the current message group being processed.
   */
  #currentGroupId?: string;

  /**
   * A set of group IDs that have already encountered failures.
   */
  readonly #failedGroupIds: Set<string>;

  public constructor() {
    this.#failedGroupIds = new Set<string>();
  }

  /**
   * Adds the specified group ID to the set of failed group IDs.
   *
   * @param group - The group ID to be added to the set of failed group IDs.
   */
  public addToFailedGroup(group: string): void {
    this.#failedGroupIds.add(group);
  }

  /**
   * Prepares the processor for a new batch of messages.
   */
  public prepare(): void {
    this.#currentGroupId = undefined;
    this.#failedGroupIds.clear();
  }

  /**
   * Sets the current group ID for the message being processed.
   *
   * @param group - The group ID of the current message being processed.
   */
  public setCurrentGroup(group?: string): void {
    this.#currentGroupId = group;
  }

  /**
   * Determines whether the current group should be short-circuited.
   *
   * If we have any failed messages, we should then short circuit the process and
   * fail remaining messages unless `skipGroupOnError` is true
   *
   * @param failureMessages - The list of failure messages.
   * @param options - The options for the batch processing.
   */
  public shouldShortCircuit(
    failureMessages: EventSourceDataClassTypes[],
    options?: BatchProcessingOptions
  ): boolean {
    return !options?.skipGroupOnError && failureMessages.length !== 0;
  }

  /**
   * Determines whether the current group should be skipped.
   *
   * If `skipGroupOnError` is true and the current group has previously failed,
   * then we should skip processing the current group.
   *
   * @param options - The options for the batch processing.
   */
  public shouldSkipCurrentGroup(options?: BatchProcessingOptions): boolean {
    return (
      (options?.skipGroupOnError ?? false) &&
      this.#currentGroupId &&
      this.#failedGroupIds.has(this.#currentGroupId)
    );
  }

  /**
   * Handles failure for current group
   * Adds the current group ID to the set of failed group IDs if `skipGroupOnError` is true.
   *
   * @param options - The options for the batch processing.
   */
  public processFailureForCurrentGroup(options?: BatchProcessingOptions) {
    if (options?.skipGroupOnError && this.#currentGroupId) {
      this.addToFailedGroup(this.#currentGroupId);
    }
  }
}

export { SqsFifoProcessor };

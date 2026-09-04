import { EventType } from './constants.js';

/**
 * Base error thrown by the Batch Processing utility
 */
class BatchProcessingError extends Error {
  public constructor(message: string) {
    super(message);
    this.name = 'BatchProcessingError';
  }
}

/**
 * Error thrown by the Batch Processing utility when all batch records failed to be processed
 */
class FullBatchFailureError extends BatchProcessingError {
  public recordErrors: Error[];

  public constructor(childErrors: Error[]) {
    super('All records failed processing. See individual errors below.');
    this.recordErrors = childErrors;
    this.name = 'FullBatchFailureError';
  }
}

/**
 * Error thrown by the Batch Processing utility when a SQS FIFO queue is short-circuited.
 * This happens when a record fails processing and the remaining records are not processed
 * to avoid out-of-order delivery.
 */
class SqsFifoShortCircuitError extends BatchProcessingError {
  public constructor() {
    super(
      'A previous record failed processing. The remaining records were not processed to avoid out-of-order delivery.'
    );
    this.name = 'SqsFifoShortCircuitError';
  }
}

/**
 * Error thrown by the Batch Processing utility when a previous record from
 * SQS FIFO queue message group fails processing.
 */
class SqsFifoMessageGroupShortCircuitError extends BatchProcessingError {
  public constructor() {
    super('A previous record from this message group failed processing');
    this.name = 'SqsFifoMessageGroupShortCircuitError';
  }
}

/**
 * Error thrown by the Batch Processing utility when a partial processor receives an unexpected
 * batch type.
 */
class UnexpectedBatchTypeError extends BatchProcessingError {
  public constructor() {
    super(
      `Unexpected batch type. Possible values are: ${Object.values(
        EventType
      ).join(', ')}`
    );
    this.name = 'UnexpectedBatchTypeError';
  }
}

/**
 * Error thrown by the Batch Processing utility when a record fails to be parsed.
 */
class ParsingError extends BatchProcessingError {
  public constructor(message: string) {
    super(message);
    this.name = 'ParsingError';
  }
}

/**
 * Message for a thrown value that is not an `Error`, preferring its own
 * `message` and falling back to a generic one when it cannot be stringified.
 *
 * @param value - The thrown value
 */
const messageOf = (value: unknown): string => {
  if (
    typeof value === 'object' &&
    value !== null &&
    'message' in value &&
    typeof value.message === 'string'
  ) {
    return value.message;
  }
  try {
    return String(value);
  } catch {
    return 'Unknown error';
  }
};

/**
 * Coerce a thrown value into an `Error`, keeping the original as `cause`.
 *
 * Record handlers can throw anything, and the failure path must never
 * throw again while recording it.
 *
 * @param value - The thrown value
 */
const toError = (value: unknown): Error => {
  if (value instanceof Error) {
    return value;
  }
  return new Error(messageOf(value), { cause: value });
};

export {
  BatchProcessingError,
  FullBatchFailureError,
  ParsingError,
  SqsFifoMessageGroupShortCircuitError,
  SqsFifoShortCircuitError,
  toError,
  UnexpectedBatchTypeError,
};

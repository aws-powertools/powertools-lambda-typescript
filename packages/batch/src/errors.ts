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

export {
  BatchProcessingError,
  FullBatchFailureError,
  SqsFifoShortCircuitError,
  SqsFifoMessageGroupShortCircuitError,
  UnexpectedBatchTypeError,
};

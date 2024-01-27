import type { IdempotencyRecord } from './persistence/IdempotencyRecord.js';

/**
 * Item attempting to be inserted into persistence store already exists and is not expired
 */
class IdempotencyItemAlreadyExistsError extends Error {
  public existingRecord?: IdempotencyRecord;

  public constructor(message?: string, existingRecord?: IdempotencyRecord) {
    super(message);
    this.existingRecord = existingRecord;
  }
}

/**
 * Item does not exist in persistence store
 */
class IdempotencyItemNotFoundError extends Error {}

/**
 * Execution with idempotency key is already in progress
 */
class IdempotencyAlreadyInProgressError extends Error {}

/**
 * An invalid status was provided
 */
class IdempotencyInvalidStatusError extends Error {}

/**
 * Payload does not match stored idempotency record
 */
class IdempotencyValidationError extends Error {
  public existingRecord?: IdempotencyRecord;

  public constructor(message?: string, existingRecord?: IdempotencyRecord) {
    super(message);
    this.existingRecord = existingRecord;
  }
}

/**
 * State is inconsistent across multiple requests to persistence store
 */
class IdempotencyInconsistentStateError extends Error {}

/**
 * Unrecoverable error from the data store
 */
class IdempotencyPersistenceLayerError extends Error {
  public readonly cause: Error | undefined;

  public constructor(message: string, cause: Error) {
    const errorMessage = `${message}. This error was caused by: ${cause.message}.`;
    super(errorMessage);
    this.cause = cause;
  }
}

/**
 * Payload does not contain an idempotent key
 */
class IdempotencyKeyError extends Error {}

export {
  IdempotencyItemAlreadyExistsError,
  IdempotencyItemNotFoundError,
  IdempotencyAlreadyInProgressError,
  IdempotencyInvalidStatusError,
  IdempotencyValidationError,
  IdempotencyInconsistentStateError,
  IdempotencyPersistenceLayerError,
  IdempotencyKeyError,
};

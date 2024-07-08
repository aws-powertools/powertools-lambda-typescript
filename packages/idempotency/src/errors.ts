import type { IdempotencyRecord } from './persistence/IdempotencyRecord.js';

/**
 * Base error for idempotency errors.
 *
 * Generally this error should not be thrown directly unless you are throwing a generic and unknown error.
 */
class IdempotencyUnknownError extends Error {
  public constructor(message?: string, options?: ErrorOptions) {
    super(message, options);
    this.name = 'IdempotencyError';
  }
}

/**
 * Item attempting to be inserted into persistence store already exists and is not expired
 */
class IdempotencyItemAlreadyExistsError extends IdempotencyUnknownError {
  public existingRecord?: IdempotencyRecord;

  public constructor(
    message?: string,
    existingRecord?: IdempotencyRecord,
    options?: ErrorOptions
  ) {
    super(message, options);
    this.name = 'IdempotencyItemAlreadyExistsError';
    this.existingRecord = existingRecord;
  }
}

/**
 * Item does not exist in persistence store
 */
class IdempotencyItemNotFoundError extends IdempotencyUnknownError {
  public constructor(message?: string, options?: ErrorOptions) {
    super(message, options);
    this.name = 'IdempotencyItemNotFoundError';
  }
}

/**
 * Execution with idempotency key is already in progress
 */
class IdempotencyAlreadyInProgressError extends IdempotencyUnknownError {
  public existingRecord?: IdempotencyRecord;

  public constructor(
    message?: string,
    existingRecord?: IdempotencyRecord,
    options?: ErrorOptions
  ) {
    super(message, options);
    this.name = 'IdempotencyAlreadyInProgressError';
    this.existingRecord = existingRecord;
  }
}

/**
 * An invalid status was provided
 */
class IdempotencyInvalidStatusError extends IdempotencyUnknownError {
  public constructor(message?: string, options?: ErrorOptions) {
    super(message, options);
    this.name = 'IdempotencyInvalidStatusError';
  }
}

/**
 * Payload does not match stored idempotency record
 */
class IdempotencyValidationError extends IdempotencyUnknownError {
  public existingRecord?: IdempotencyRecord;

  public constructor(
    message?: string,
    existingRecord?: IdempotencyRecord,
    options?: ErrorOptions
  ) {
    super(message, options);
    this.name = 'IdempotencyValidationError';
    this.existingRecord = existingRecord;
  }
}

/**
 * State is inconsistent across multiple requests to persistence store
 */
class IdempotencyInconsistentStateError extends IdempotencyUnknownError {
  public constructor(message?: string, options?: ErrorOptions) {
    super(message, options);
    this.name = 'IdempotencyInconsistentStateError';
  }
}

/**
 * Unrecoverable error from the data store
 */
class IdempotencyPersistenceLayerError extends IdempotencyUnknownError {
  public readonly cause: Error | undefined;

  public constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = 'IdempotencyPersistenceLayerError';
  }
}

/**
 * Payload does not contain an idempotent key
 */
class IdempotencyKeyError extends IdempotencyUnknownError {
  public constructor(message?: string, options?: ErrorOptions) {
    super(message, options);
    this.name = 'IdempotencyKeyError';
  }
}

export {
  IdempotencyUnknownError,
  IdempotencyItemAlreadyExistsError,
  IdempotencyItemNotFoundError,
  IdempotencyAlreadyInProgressError,
  IdempotencyInvalidStatusError,
  IdempotencyValidationError,
  IdempotencyInconsistentStateError,
  IdempotencyPersistenceLayerError,
  IdempotencyKeyError,
};

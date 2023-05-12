/**
 * Item attempting to be inserted into persistence store already exists and is not expired
 */
class IdempotencyItemAlreadyExistsError extends Error {}

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
class IdempotencyValidationError extends Error {}

/**
 * State is inconsistent across multiple requests to persistence store
 */
class IdempotencyInconsistentStateError extends Error {}

/**
 * Unrecoverable error from the data store
 */
class IdempotencyPersistenceLayerError extends Error {}

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

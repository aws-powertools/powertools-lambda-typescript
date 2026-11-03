import type { BasePersistenceAttributes } from './types/BasePersistenceLayer.js';

/**
 * Number of times to retry a request in case of `IdempotencyInconsistentStateError`
 *
 * Used in `IdempotencyHandler` and `makeHandlerIdempotent`
 *
 * @internal
 */
const MAX_RETRIES = 2;

/**
 * Idempotency record status.
 *
 * A record is created when a request is received. The status is set to `INPROGRESS` and the request is processed.
 * After the request is processed, the status is set to `COMPLETED`. If the request is not processed within the
 * `inProgressExpiryTimestamp`, the status is set to `EXPIRED`.
 */
const IdempotencyRecordStatus = {
  INPROGRESS: 'INPROGRESS',
  COMPLETED: 'COMPLETED',
  EXPIRED: 'EXPIRED',
} as const;

/**
 * Base persistence attribute key names for persistence layers
 */
const PERSISTENCE_ATTRIBUTE_KEY_MAPPINGS: Record<
  keyof Required<BasePersistenceAttributes>,
  string
> = {
  statusAttr: 'status',
  expiryAttr: 'expiration',
  inProgressExpiryAttr: 'in_progress_expiration',
  dataAttr: 'data',
  validationKeyAttr: 'validation',
  ownerAttr: 'owner',
} as const;

/**
 * Names of the durable steps that run the persistence calls made after the
 * wrapped function settles, when it runs in a durable execution.
 *
 * Running these calls in a step keeps the durable execution SDK from
 * suspending the invocation while they are in flight.
 *
 * @internal
 */
const IdempotencyDurableStepName = {
  SAVE_SUCCESS: 'powertools-idempotency-save',
  DELETE_IN_PROGRESS: 'powertools-idempotency-delete',
} as const;

export {
  IdempotencyDurableStepName,
  IdempotencyRecordStatus,
  MAX_RETRIES,
  PERSISTENCE_ATTRIBUTE_KEY_MAPPINGS,
};

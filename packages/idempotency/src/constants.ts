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

export { IdempotencyRecordStatus, MAX_RETRIES };

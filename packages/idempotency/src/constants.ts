/**
 * Number of times to retry a request in case of `IdempotencyInconsistentStateError`
 *
 * Used in `IdempotencyHandler` and `makeHandlerIdempotent`
 *
 * @internal
 */
const MAX_RETRIES = 2;

export { MAX_RETRIES };

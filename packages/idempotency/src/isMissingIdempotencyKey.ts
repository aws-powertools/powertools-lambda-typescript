import type { JSONValue } from '@aws-lambda-powertools/commons/types';

/**
 * Whether the payload selected by the `eventKeyJmesPath` expression has no value
 * to generate an idempotency key from.
 *
 * `null`, `undefined` and empty strings are missing, while numbers and booleans,
 * including `0` and `false`, are present. A JMESPath multi-select keeps its shape
 * when all the selected values are missing, so an array or object whose values are
 * all `null` is missing a key too.
 *
 * It is shared by the key generator and by the check that skips idempotency, so that
 * a selection that cannot identify a request is never hashed into a shared record.
 *
 * @param data - the payload selected to generate the idempotency key
 */
const isMissingIdempotencyKey = (data: JSONValue | undefined): boolean => {
  if (data === null || data === undefined) return true;
  if (typeof data === 'object') {
    return Object.values(data).every(
      (value) => value === null || value === undefined
    );
  }
  if (typeof data === 'number' || typeof data === 'boolean') return false;

  return data === '';
};

export { isMissingIdempotencyKey };

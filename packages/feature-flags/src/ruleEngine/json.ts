import {
  isNull,
  isNumber,
  isRecord,
  isString,
} from '@aws-lambda-powertools/commons';
import type { JSONValue } from '@aws-lambda-powertools/commons/types';

/**
 * Checks JSON values at the source boundary, including callers that bypass types.
 * @param value - Supply the value to check
 * @param ancestors - Track containers to reject cycles without rejecting shared values
 * @internal
 */
const isJSONValue = (
  value: unknown,
  ancestors = new Set<unknown>()
): value is JSONValue => {
  if (isNull(value) || isString(value) || typeof value === 'boolean')
    return true;
  if (isNumber(value)) return Number.isFinite(value);
  if (!Array.isArray(value) && !isRecord(value)) return false;
  // Custom serializers can hide invalid fields or replace content before the cache key is computed.
  if (typeof Reflect.get(value, 'toJSON') === 'function') return false;
  if (ancestors.has(value)) return false;
  ancestors.add(value);
  const entries = Array.isArray(value)
    ? Array.from(value)
    : Object.values(value);
  const valid = entries.every((entry) => isJSONValue(entry, ancestors));
  ancestors.delete(value);
  return valid;
};

/**
 * Copies structured results so callers cannot mutate a cached snapshot.
 * @param value - Supply the validated result value
 * @internal
 */
const cloneJSONValue = (value: JSONValue): JSONValue =>
  typeof value === 'object' && value !== null ? structuredClone(value) : value;

export { cloneJSONValue, isJSONValue };

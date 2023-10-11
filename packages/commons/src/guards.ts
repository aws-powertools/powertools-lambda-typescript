/**
 * Returns true if the passed value is a record (object).
 *
 * @param value
 */
const isRecord = (value: unknown): value is Record<string, unknown> => {
  return (
    Object.prototype.toString.call(value) === '[object Object]' &&
    !Object.is(value, null)
  );
};

/**
 * Returns true if the passed value is truthy.
 *
 * @param value
 */
const isTruthy = (value: unknown): boolean => {
  if (typeof value === 'string') {
    return value !== '';
  } else if (typeof value === 'number') {
    return value !== 0;
  } else if (typeof value === 'boolean') {
    return value;
  } else if (Array.isArray(value)) {
    return value.length > 0;
  } else if (isRecord(value)) {
    return Object.keys(value).length > 0;
  } else {
    return false;
  }
};

/**
 * Returns true if the passed value is null or undefined.
 *
 * @param value
 */
const isNullOrUndefined = (value: unknown): value is null | undefined => {
  return Object.is(value, null) || Object.is(value, undefined);
};

/**
 * Returns true if the passed value is a string.
 * @param value
 * @returns
 */
const isString = (value: unknown): value is string => {
  return typeof value === 'string';
};

export { isRecord, isString, isTruthy, isNullOrUndefined };

/**
 * Returns true if the passed value is a record (object).
 *
 * @param value The value to check
 */
const isRecord = (value: unknown): value is Record<string, unknown> => {
  return (
    Object.prototype.toString.call(value) === '[object Object]' &&
    !Object.is(value, null)
  );
};

/**
 * Check if a value is a string.
 *
 * @param value The value to check
 */
const isString = (value: unknown): value is string => {
  return typeof value === 'string';
};

/**
 * Check if a value is a number.
 *
 * @param value The value to check
 */
const isNumber = (value: unknown): value is number => {
  return typeof value === 'number';
};

/**
 * Check if a value is an integer number.
 *
 * @param value The value to check
 */
const isIntegerNumber = (value: unknown): value is number => {
  return isNumber(value) && Number.isInteger(value);
};

/**
 * Check if a value is truthy.
 *
 * @param value The value to check
 */
const isTruthy = (value: unknown): boolean => {
  if (isString(value)) {
    return value !== '';
  } else if (isNumber(value)) {
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
 * Check if a value is null.
 *
 * @param value The value to check
 */
const isNull = (value: unknown): value is null => {
  return Object.is(value, null);
};

/**
 * Check if a value is null or undefined.
 *
 * @param value The value to check
 */
const isNullOrUndefined = (value: unknown): value is null | undefined => {
  return isNull(value) || Object.is(value, undefined);
};

/**
 * Get the type of a value as a string.
 *
 * @param value The value to check
 */
const getType = (value: unknown): string => {
  if (Array.isArray(value)) {
    return 'array';
  } else if (isRecord(value)) {
    return 'object';
  } else if (isString(value)) {
    return 'string';
  } else if (isNumber(value)) {
    return 'number';
  } else if (typeof value === 'boolean') {
    return 'boolean';
  } else if (isNull(value)) {
    return 'null';
  } else {
    return 'unknown';
  }
};

/**
 * Compare two arrays for strict equality.
 *
 * @param left The left array to compare
 * @param right The right array to compare
 */
const areArraysEqual = (left: unknown[], right: unknown[]): boolean => {
  if (left.length !== right.length) {
    return false;
  }

  return left.every((value, i) => isStrictEqual(value, right[i]));
};

/**
 * Compare two records for strict equality.
 *
 * @param left The left record to compare
 * @param right The right record to compare
 */
const areRecordsEqual = (
  left: Record<string, unknown>,
  right: Record<string, unknown>
): boolean => {
  const leftKeys = Object.keys(left);
  const rightKeys = Object.keys(right);

  if (leftKeys.length !== rightKeys.length) {
    return false;
  }

  return leftKeys.every((key) => isStrictEqual(left[key], right[key]));
};

/**
 * Check if two unknown values are strictly equal.
 *
 * If the values are arrays, then each element is compared, regardless of
 * order. If the values are objects, then each key and value from left
 * is compared to the corresponding key and value from right. If the
 * values are primitives, then they are compared using strict equality.
 *
 * @param left Left side of strict equality comparison
 * @param right Right side of strict equality comparison
 */
const isStrictEqual = (left: unknown, right: unknown): boolean => {
  if (left === right) {
    return true;
  }

  if (typeof left !== typeof right) {
    return false;
  }

  if (Array.isArray(left) && Array.isArray(right)) {
    return areArraysEqual(left, right);
  }

  if (isRecord(left) && isRecord(right)) {
    return areRecordsEqual(left, right);
  }

  return false;
};

export {
  isRecord,
  isString,
  isNumber,
  isIntegerNumber,
  isTruthy,
  isNull,
  isNullOrUndefined,
  getType,
  isStrictEqual,
};

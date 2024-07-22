/**
 * Check if a value is a record.
 *
 * @example
 * ```typescript
 * import { isRecord } from '@aws-lambda-powertools/commons/typeUtils';
 *
 * const value = { key: 'value' };
 * if (isRecord(value)) {
 *   // value is a record
 * }
 * ```
 *
 * @param value The value to check
 */
const isRecord = (
  value: unknown
): value is Record<string | number, unknown> => {
  return (
    Object.prototype.toString.call(value) === '[object Object]' &&
    !Object.is(value, null)
  );
};

/**
 * Check if a value is a string.
 *
 * @example
 * ```typescript
 * import { isString } from '@aws-lambda-powertools/commons/typeUtils';
 *
 * const value = 'foo';
 * if (isString(value)) {
 *   // value is a string
 * }
 * ```
 *
 * @param value The value to check
 */
const isString = (value: unknown): value is string => {
  return typeof value === 'string';
};

/**
 * Check if a value is a number.
 *
 * @example
 * ```typescript
 * import { isNumber } from '@aws-lambda-powertools/commons/typeUtils';
 *
 * const value = 42;
 * if (isNumber(value)) {
 *   // value is a number
 * }
 * ```
 *
 * @param value The value to check
 */
const isNumber = (value: unknown): value is number => {
  return typeof value === 'number';
};

/**
 * Check if a value is an integer number.
 *
 * @example
 * ```typescript
 * import { isIntegerNumber } from '@aws-lambda-powertools/commons/typeUtils';
 *
 * const value = 42;
 * if (isIntegerNumber(value)) {
 *   // value is an integer number
 * }
 * ```
 *
 * @param value The value to check
 */
const isIntegerNumber = (value: unknown): value is number => {
  return isNumber(value) && Number.isInteger(value);
};

/**
 * Check if a value is truthy.
 *
 * @example
 * ```typescript
 * import { isTruthy } from '@aws-lambda-powertools/commons/typeUtils';
 *
 * const value = 'yes';
 * if (isTruthy(value)) {
 *   // value is truthy
 * }
 * ```
 *
 * @see https://github.com/getify/You-Dont-Know-JS/blob/2nd-ed/types-grammar/ch4.md#toboolean
 *
 * @param value The value to check
 */
const isTruthy = (value: unknown): boolean => {
  if (isString(value)) {
    return value !== '';
  }
  if (isNumber(value)) {
    return value !== 0;
  }
  if (typeof value === 'boolean') {
    return value;
  }
  if (Array.isArray(value)) {
    return value.length > 0;
  }
  if (isRecord(value)) {
    return Object.keys(value).length > 0;
  }

  return false;
};

/**
 * Check if a value is `null`.
 *
 * @example
 * ```typescript
 * import { isNull } from '@aws-lambda-powertools/commons/typeUtils';
 *
 * const value = null;
 * if (isNull(value)) {
 *   // value is null
 * }
 * ```
 *
 * @param value The value to check
 */
const isNull = (value: unknown): value is null => {
  return Object.is(value, null);
};

/**
 * Check if a value is `null` or `undefined`.
 *
 * @example
 * ```typescript
 * import { isNullOrUndefined } from '@aws-lambda-powertools/commons/typeUtils';
 *
 * const value = null;
 * if (isNullOrUndefined(value)) {
 *   // value is null or undefined
 * }
 * ```
 *
 * @param value The value to check
 */
const isNullOrUndefined = (value: unknown): value is null | undefined => {
  return isNull(value) || Object.is(value, undefined);
};

/**
 * Get the type of a value as a string.
 *
 * @example
 * ```typescript
 * import { getType } from '@aws-lambda-powertools/commons/typeUtils';
 *
 * const type = getType('foo'); // 'string'
 * const otherType = getType(42); // 'number'
 * const anotherType = getType({ key: 'value' }); // 'object'
 * const unknownType = getType(Symbol('foo')); // 'unknown'
 * ```
 *
 * @param value The value to check
 */
const getType = (value: unknown): string => {
  if (Array.isArray(value)) {
    return 'array';
  }
  if (isRecord(value)) {
    return 'object';
  }
  if (isString(value)) {
    return 'string';
  }
  if (isNumber(value)) {
    return 'number';
  }
  if (typeof value === 'boolean') {
    return 'boolean';
  }
  if (isNull(value)) {
    return 'null';
  }

  return 'unknown';
};

/**
 * Compare two arrays for strict equality.
 *
 * This function compares each element in the arrays, regardless of order.
 *
 * @example
 * ```typescript
 * import { areArraysEqual } from '@aws-lambda-powertools/commons/typeUtils';
 *
 * const left = [1, 2, 3];
 * const right = [3, 2, 1];
 * const equal = areArraysEqual(left, right); // true
 *
 * const otherLeft = [1, 2, 3];
 * const otherRight = [1, 2, 4];
 * const otherEqual = areArraysEqual(otherLeft, otherRight); // false
 * ```
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
 * @example
 * ```typescript
 * import { areRecordsEqual } from '@aws-lambda-powertools/commons/typeUtils';
 *
 * const left = { key: 'value' };
 * const right = { key: 'value' };
 * const equal = areRecordsEqual(left, right); // true
 *
 * const otherLeft = { key: 'value' };
 * const otherRight = { key: 'other value' };
 * const otherEqual = areRecordsEqual(otherLeft, otherRight); // false
 * ```
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
 * @example
 * ```typescript
 * import { isStrictEqual } from '@aws-lambda-powertools/commons/typeUtils';
 *
 * const left = { key: 'value' };
 * const right = { key: 'value' };
 * const equal = isStrictEqual(left, right); // true
 *
 * const otherLeft = [1, 2, 3];
 * const otherRight = [3, 2, 1];
 * const otherEqual = isStrictEqual(otherLeft, otherRight); // true
 *
 * const anotherLeft = 'foo';
 * const anotherRight = 'bar';
 * const anotherEqual = isStrictEqual(anotherLeft, anotherRight); // false
 *
 * const yetAnotherLeft = 42;
 * const yetAnotherRight = 42;
 * const yetAnotherEqual = isStrictEqual(yetAnotherLeft, yetAnotherRight); // true
 * ```
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

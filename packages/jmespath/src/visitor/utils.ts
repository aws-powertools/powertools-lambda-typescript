import type { TreeInterpreter } from './TreeInterpreter';
import type { Node, JSONValue } from '../types';

/**
 * Apply a JMESPath expression to a JSON value.
 */
class Expression {
  readonly #expression: Node;
  readonly #interpreter: TreeInterpreter;

  public constructor(expression: Node, interpreter: TreeInterpreter) {
    this.#expression = expression;
    this.#interpreter = interpreter;
  }

  public visit(value: JSONValue, node?: Node): JSONValue {
    return this.#interpreter.visit(node ?? this.#expression, value);
  }
}

/**
 * TODO: write docs for isRecord() type guard
 *
 * @param value
 * @returns
 */
const isRecord = (value: unknown): value is Record<string, unknown> => {
  return (
    Object.prototype.toString.call(value) === '[object Object]' &&
    !Object.is(value, null)
  );
};

/**
 * TODO: write docs for isTruthy()
 * @param value
 * @returns
 */
const isTruthy = (value: unknown): boolean => {
  if (typeof value === 'string') {
    return value !== '';
  } else if (typeof value === 'number') {
    return true;
  } else if (typeof value === 'boolean') {
    return value;
  } else if (Array.isArray(value)) {
    return value.length > 0;
  } else if (isRecord(value)) {
    return Object.keys(value).length > 0;
  } else {
    return Object.is(value, true);
  }
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
 * @returns True if the values are strictly equal, false otherwise
 */
const isStrictEqual = (left: unknown, right: unknown): boolean => {
  if (left === right) {
    return true;
  } else if (typeof left !== typeof right) {
    return false;
  } else if (Array.isArray(left) && Array.isArray(right)) {
    if (left.length !== right.length) {
      return false;
    }
    for (const [i, value] of left.entries()) {
      if (!isStrictEqual(value, right[i])) {
        return false;
      }
    }

    return true;
  } else if (isRecord(left) && isRecord(right)) {
    const leftKeys = Object.keys(left);
    const leftValues = Object.values(left);
    const rightKeys = Object.keys(right);
    const rightValues = Object.values(right);
    if (
      leftKeys.length !== rightKeys.length ||
      leftValues.length !== rightValues.length
    ) {
      return false;
    }

    return (
      isStrictEqual(leftKeys, rightKeys) &&
      isStrictEqual(leftValues, rightValues)
    );
  } else {
    return false;
  }
};

/**
 * Check if a value is a number.
 *
 * @param value The value to check
 * @returns True if the value is a number, false otherwise
 */
const isNumber = (value: unknown): value is number => {
  return typeof value === 'number';
};

/**
 * Check if a value is an integer number.
 *
 * @param value The value to check
 * @returns True if the value is an integer number, false otherwise
 */
const isIntegerNumber = (value: unknown): value is number => {
  return isNumber(value) && Number.isInteger(value);
};

/**
 * @internal
 * Cap a slice range value to the length of an array, taking into account
 * negative values and whether the step is negative.
 *
 * @param arrayLength The length of the array
 * @param value The value to cap
 * @param isStepNegative Whether the step is negative
 * @returns The capped value
 */
const capSliceRange = (
  arrayLength: number,
  value: number,
  isStepNegative: boolean
): number => {
  if (value < 0) {
    value += arrayLength;
    if (value < 0) {
      value = isStepNegative ? -1 : 0;
    }
  } else if (value >= arrayLength) {
    value = isStepNegative ? arrayLength - 1 : arrayLength;
  }

  return value;
};

/**
 * Given a start, stop, and step value, the sub elements in an array are extracted as follows:
 * * The first element in the extracted array is the index denoted by start.
 * * The last element in the extracted array is the index denoted by end - 1.
 * * The step value determines how many indices to skip after each element is selected from the array. An array of 1 (the default step) will not skip any indices. A step value of 2 will skip every other index while extracting elements from an array. A step value of -1 will extract values in reverse order from the array.
 *
 * Slice expressions adhere to the following rules:
 * * If a negative start position is given, it is calculated as the total length of the array plus the given start position.
 * * If no start position is given, it is assumed to be 0 if the given step is greater than 0 or the end of the array if the given step is less than 0.
 * * If a negative stop position is given, it is calculated as the total length of the array plus the given stop position.
 * * If no stop position is given, it is assumed to be the length of the array if the given step is greater than 0 or 0 if the given step is less than 0.
 * * If the given step is omitted, it it assumed to be 1.
 * * If the given step is 0, an invalid-value error MUST be raised (thrown before calling the function)
 * * If the element being sliced is not an array, the result is null (returned before calling the function)
 * * If the element being sliced is an array and yields no results, the result MUST be an empty array.
 *
 * @param array The array to slice
 * @param start The start index
 * @param end The end index
 * @param step The step value
 */
const sliceArray = <T>(
  array: T[],
  start?: number,
  end?: number,
  step?: number
): T[] | null => {
  step = isIntegerNumber(step) ? step : 1;
  const isStepNegative = step < 0;
  const length = array.length;

  start = isIntegerNumber(start)
    ? capSliceRange(length, start, isStepNegative)
    : isStepNegative
      ? length - 1
      : 0;

  end = isIntegerNumber(end)
    ? capSliceRange(length, end, isStepNegative)
    : isStepNegative
      ? -1
      : length;

  const result: T[] = [];
  if (step > 0) {
    for (let i = start; i < end; i += step) {
      result.push(array[i]);
    }
  } else {
    for (let i = start; i > end; i += step) {
      result.push(array[i]);
    }
  }

  return result;
};

export {
  Expression,
  isRecord,
  isTruthy,
  isStrictEqual,
  isNumber,
  isIntegerNumber,
  sliceArray,
};

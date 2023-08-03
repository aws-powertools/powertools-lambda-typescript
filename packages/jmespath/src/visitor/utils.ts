import type { TreeInterpreter } from './TreeInterpreter';
import type { Node, JSONValue } from '../types';

/**
 * TODO: write docs for Expression
 * TODO: see if #expression is needed
 */
class Expression {
  readonly #expression: Node;
  readonly #interpreter: TreeInterpreter;

  public constructor(expression: Node, interpreter: TreeInterpreter) {
    this.#expression = expression;
    this.#interpreter = interpreter;
  }

  public visit(node: Node, value: JSONValue): JSONValue {
    return this.#interpreter.visit(node, value);
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

export { Expression, isRecord, isTruthy, isStrictEqual };

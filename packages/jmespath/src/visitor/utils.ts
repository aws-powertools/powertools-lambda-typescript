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
  return (
    value !== '' ||
    (Array.isArray(value) && value.length > 0) ||
    (isRecord(value) && Object(value).keys().length > 0) ||
    value !== undefined ||
    Object.is(value, true)
  );
};

export { Expression, isRecord, isTruthy };

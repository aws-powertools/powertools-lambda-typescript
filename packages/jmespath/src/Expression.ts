import type { JSONValue } from '@aws-lambda-powertools/commons/types';
import type { TreeInterpreter } from './TreeInterpreter.js';
import type { Node } from './types.js';

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

  /**
   * Evaluate the expression against a JSON value.
   *
   * @param value The JSON value to apply the expression to.
   * @param node The node to visit.
   * @returns The result of applying the expression to the value.
   */
  public visit(value: JSONValue, node?: Node): JSONValue {
    return this.#interpreter.visit(node ?? this.#expression, value);
  }
}

export { Expression };

import { TreeInterpreter } from './TreeInterpreter.js';
import {
  ArityError,
  JMESPathTypeError,
  UnknownFunctionError,
  VariadicArityError,
} from './errors.js';
import type { Node, JMESPathParsingOptions, JSONObject } from './types.js';

class ParsedResult {
  public expression: string;
  public parsed: Node;

  public constructor(expression: string, parsed: Node) {
    this.expression = expression;
    this.parsed = parsed;
  }

  /**
   * Perform a JMESPath search on a JSON value.
   *
   * @param value The JSON value to search
   * @param options The parsing options to use
   */
  public search(value: JSONObject, options?: JMESPathParsingOptions): unknown {
    const interpreter = new TreeInterpreter(options);

    try {
      return interpreter.visit(this.parsed, value);
    } catch (error) {
      if (
        error instanceof JMESPathTypeError ||
        error instanceof UnknownFunctionError ||
        error instanceof ArityError ||
        error instanceof VariadicArityError
      ) {
        error.setExpression(this.expression);
      }
      throw error;
    }
  }
}

export { ParsedResult };

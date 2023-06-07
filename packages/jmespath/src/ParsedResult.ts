import { TreeInterpreter } from './visitor';
import {
  JMESPathTypeError,
  UnknownFunctionError,
  ArityError,
  VariadicArityError,
} from './errors';
import type { Node, JSONValue, ParsingOptions } from './types';

class ParsedResult {
  public expression: string;
  public parsed: Node;

  public constructor(expression: string, parsed: Node) {
    this.expression = expression;
    this.parsed = parsed;
  }

  public search(value: JSONValue, options?: ParsingOptions): unknown {
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

import { TreeInterpreter } from './visitor';
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

    return interpreter.visit(this.parsed, value);
  }
}

export { ParsedResult };

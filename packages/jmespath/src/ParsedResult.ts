import { TreeInterpreter } from './visitor';
import type { Node } from './types';

class ParsedResult {
  public expression: string;
  public parsed: Node;

  public constructor(expression: string, parsed: Node) {
    this.expression = expression;
    this.parsed = parsed;
  }

  public search(value: unknown, options?: unknown): unknown {
    const interpreter = new TreeInterpreter(options);

    return interpreter.visit(this.parsed, value);
  }
}

export { ParsedResult };

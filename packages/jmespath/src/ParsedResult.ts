import { TreeInterpreter, GraphvizVisitor } from './visitor';

class ParsedResult {
  public expression: string;
  public parsed: unknown[];

  public constructor(expression: string, parsed: unknown[]) {
    this.expression = expression;
    this.parsed = parsed;
  }

  /**
   * Render the parsed AST as a dot file.
   *
   * TODO: write docs for ParsedResult#renderDotFile()
   * @see https://github.com/jmespath/jmespath.py/blob/develop/jmespath/parser.py#L515-L519
   */
  public renderDotFile(): string {
    const renderer = new GraphvizVisitor();

    return renderer.visit(this.parsed);
  }

  public search(value: unknown, options?: unknown): unknown {
    const interpreter = new TreeInterpreter(options);

    return interpreter.visit(this.parsed, value);
  }
}

export { ParsedResult };

import { Parser } from './Parser';
import type { ParsedResult } from './ParsedResult';

/**
 * TODO: see if this Expression type should be the return of compile()
 */
/* type Expression = {
  type: string;
  children: Expression[];
  value: string;
}; */

/**
 * TODO: write docs for compile()
 * TODO: fix types for compile()
 *
 * @param expression The JMESPath expression to compile.
 */
const compile = (expression: string): ParsedResult => {
  return new Parser().parse(expression);
};

export { compile };

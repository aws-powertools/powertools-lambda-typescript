import { Parser } from './Parser';
import type { JSONValue, ParsingOptions } from './types';

/**
 * TODO: write docs for search()
 *
 * @param expression
 * @param data
 * @param options
 * @returns
 */
const search = (
  expression: string,
  data: JSONValue,
  options?: ParsingOptions
): unknown => {
  return new Parser().parse(expression).search(data, options);
};

export { search };

import { Parser } from './Parser';

/**
 * TODO: write docs for search()
 * TODO: fix types for search()
 *
 * @param expression
 * @param data
 * @param options
 * @returns
 */
const search = (
  expression: string,
  data: unknown,
  options?: unknown
): unknown => {
  return new Parser().parse(expression).search(data, options);
};

export { search };

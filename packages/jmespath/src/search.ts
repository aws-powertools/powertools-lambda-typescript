import { Parser } from './Parser.js';
import type { ParsingOptions, JSONObject } from './types.js';

const parser = new Parser();

/**
 * Search for data in a JSON object using a JMESPath expression.
 *
 * @example
 * ```typescript
 * import { search } from '@aws-lambda-powertools/jmespath';
 *
 * const data = {
 *   foo: {
 *     bar: {
 *       baz: 1
 *     }
 *   }
 * };
 *
 * const result = search('foo.bar.baz', data);
 * console.log(result); // 1
 * ```
 *
 * By default the search function will use all the built-in functions
 * present in the [JMESPath specification](https://jmespath.org/specification.html).
 *
 * Powertools for AWS Lambda provides some additional functions that can be used
 * by passing them in the `customFunctions` option.
 *
 * @example
 * ```typescript
 * import { search } from '@aws-lambda-powertools/jmespath';
 * import { PowertoolsFunctions } from '@aws-lambda-powertools/jmespath/functions';
 *
 * const data = {
 *   body: "{\"foo\": \"bar\"}"
 * };
 *
 * const result = search(
 *   'powertools_json(body)',
 *   data,
 *   { customFunctions: new PowertoolsFunctions() }
 * );
 * console.log(result); // { foo: 'bar' }
 * ```
 *
 * @param expression The JMESPath expression to use
 * @param data The JSON object to search
 * @param options The parsing options to use
 */
const search = (
  expression: string,
  data: JSONObject,
  options?: ParsingOptions
): unknown => {
  return parser.parse(expression).search(data, options);
};

export { search };

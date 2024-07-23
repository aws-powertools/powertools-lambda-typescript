import type {
  JSONArray,
  JSONValue,
} from '@aws-lambda-powertools/commons/types';
import type { Functions } from './Functions.js';
import type { BINDING_POWER } from './constants.js';

/**
 * A token in the JMESPath AST.
 */
type Token = {
  type: keyof typeof BINDING_POWER;
  value: JSONValue;
  start: number;
  end: number;
};

/**
 * A node in the JMESPath AST.
 */
type Node = {
  type: string;
  children: Node[];
  value?: JSONValue;
};

/**
 * Options for parsing.
 *
 * You can use this type to customize the parsing of JMESPath expressions.
 *
 * For example, you can use this type to provide custom functions to the parser.
 *
 * @example
 * ```typescript
 * import { search } from '@aws-lambda-powertools/jmespath';
 * import { PowertoolsFunctions } from '@aws-lambda-powertools/jmespath/functions';
 *
 * const expression = 'powertools_json(@)';
 *
 * const result = search(expression, "{\n  \"a\": 1\n}", {
 *   customFunctions: new PowertoolsFunctions(),
 * });
 * console.log(result); // { a: 1 }
 * ```
 */
type JMESPathParsingOptions = {
  /**
   * The custom functions to use.
   *
   * By default, the interpreter uses the standard JMESPath functions
   * available in the [JMESPath specification](https://jmespath.org/specification.html).
   */
  customFunctions?: Functions;
};

/**
 * Decorator for function signatures.
 */
type FunctionSignatureDecorator = (
  target: Functions | typeof Functions,
  propertyKey: string | symbol,
  descriptor: PropertyDescriptor
) => void;

/**
 * Options for a function signature.
 *
 * @example
 * ```typescript
 * import { PowertoolsFunctions } from '@aws-lambda-powertools/jmespath/functions';
 *
 * class MyFunctions extends Functions {
 *   ⁣@Functions.signature({
 *     argumentsSpecs: [['number'], ['number']],
 *     variadic: true,
 *   })
 *   public funcMyMethod(args: Array<number>): unknown {
 *     // ...
 *   }
 * }
 * ```
 *
 * @param argumentsSpecs The expected arguments for the function.
 * @param variadic Whether the function is variadic.
 */
type FunctionSignatureOptions = {
  argumentsSpecs: Array<Array<string>>;
  variadic?: boolean;
};

/**
 * A JSON parseable object.
 */
type JSONObject = JSONArray | JSONValue | object;

export type {
  FunctionSignatureDecorator,
  FunctionSignatureOptions,
  Node,
  JMESPathParsingOptions,
  Token,
  JSONObject,
};

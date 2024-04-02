import type {
  JSONArray,
  JSONObject,
  JSONValue,
} from '@aws-lambda-powertools/commons/types';
import {
  getType,
  isNumber,
  isRecord,
} from '@aws-lambda-powertools/commons/typeutils';
import type { Expression } from './Expression.js';
import { JMESPathTypeError } from './errors.js';
import type {
  FunctionSignatureDecorator,
  FunctionSignatureOptions,
  JSONObject as JSONObjectType,
} from './types.js';
import { arityCheck, typeCheck } from './utils.js';

/**
 * A class that contains the built-in JMESPath functions.
 *
 * The built-in functions are implemented as methods on the Functions class.
 * Each method is decorated with the `@Function.signature()` decorator to enforce the
 * arity and types of the arguments passed to the function at runtime.
 *
 * You can extend the Functions class to add custom functions by creating a new class
 * that extends Functions and adding new methods to it.
 *
 * @example
 * ```typescript
 * import { search } from '@aws-lambda-powertools/jmespath';
 * import { Functions } from '@aws-lambda-powertools/jmespath/functions';
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
 *
 * const myFunctions = new MyFunctions();
 *
 * search('myMethod(@)', {}, { customFunctions: new MyFunctions() });
 * ```
 */
class Functions {
  public methods: Set<string> = new Set();
  /**
   * Get the absolute value of the provided number.
   *
   * @param args The number to get the absolute value of
   */
  @Functions.signature({ argumentsSpecs: [['number']] })
  public funcAbs(args: number): number {
    return Math.abs(args);
  }

  /**
   * Calculate the average of the numbers in the provided array.
   *
   * @param args The numbers to average
   */
  @Functions.signature({
    argumentsSpecs: [['array-number']],
  })
  public funcAvg(args: Array<number>): number {
    return args.reduce((a, b) => a + b, 0) / args.length;
  }

  /**
   * Get the ceiling of the provided number.
   *
   * @param args The number to get the ceiling of
   */
  @Functions.signature({ argumentsSpecs: [['number']] })
  public funcCeil(args: number): number {
    return Math.ceil(args);
  }

  /**
   * Determine if the given value is contained in the provided array or string.
   *
   * @param haystack The array or string to check
   * @param needle The value to check for
   */
  @Functions.signature({
    argumentsSpecs: [['array', 'string'], ['any']],
  })
  public funcContains(haystack: string, needle: string): boolean {
    return haystack.includes(needle);
  }

  /**
   * Determines if the provided string ends with the provided suffix.
   *
   * @param str The string to check
   * @param suffix The suffix to check for
   */
  @Functions.signature({
    argumentsSpecs: [['string'], ['string']],
  })
  public funcEndsWith(str: string, suffix: string): boolean {
    return str.endsWith(suffix);
  }

  /**
   * Get the floor of the provided number.
   *
   * @param args The number to get the floor of
   */
  @Functions.signature({ argumentsSpecs: [['number']] })
  public funcFloor(args: number): number {
    return Math.floor(args);
  }

  /**
   * Join the provided array into a single string.
   *
   * @param separator The separator to use
   * @param items The array of itmes to join
   */
  @Functions.signature({
    argumentsSpecs: [['string'], ['array-string']],
  })
  public funcJoin(separator: string, items: Array<string>): string {
    return items.join(separator);
  }

  /**
   * Get the keys of the provided object.
   *
   * @param arg The object to get the keys of
   */
  @Functions.signature({
    argumentsSpecs: [['object']],
  })
  public funcKeys(arg: JSONObject): string[] {
    return Object.keys(arg);
  }

  /**
   * Get the number of items in the provided item.
   *
   * @param arg The array to get the length of
   */
  @Functions.signature({
    argumentsSpecs: [['array', 'string', 'object']],
  })
  public funcLength(
    arg: string | Array<unknown> | Record<string, unknown>
  ): number {
    if (isRecord(arg)) {
      return Object.keys(arg).length;
    } else {
      return arg.length;
    }
  }

  /**
   * Map the provided function over the provided array.
   *
   * @param expression The expression to map over the array
   * @param args The array to map the expression over
   */
  @Functions.signature({
    argumentsSpecs: [['any'], ['array']],
  })
  public funcMap(
    expression: Expression,
    args: JSONArray
  ): JSONArray | Array<unknown> {
    return args.map((arg: JSONObjectType) => {
      return expression.visit(arg) || null;
    });
  }

  /**
   * Get the maximum value in the provided array.
   *
   * @param arg The array to get the maximum value of
   */
  @Functions.signature({
    argumentsSpecs: [['array-number', 'array-string']],
  })
  public funcMax(arg: Array<number | string>): number | string | null {
    if (arg.length === 0) {
      return null;
      // The signature decorator already enforces that all elements are of the same type
    } else if (isNumber(arg[0])) {
      return Math.max(...(arg as number[]));
    } else {
      // local compare function to handle string comparison
      return arg.reduce((a, b) => (a > b ? a : b));
    }
  }

  /**
   * Get the item in the provided array that has the maximum value when the provided expression is evaluated.
   *
   * @param args The array of items to get the maximum value of
   * @param expression The expression to evaluate for each item in the array
   */
  @Functions.signature({
    argumentsSpecs: [['array'], ['expression']],
  })
  public funcMaxBy(
    args: Array<JSONObject>,
    expression: Expression
  ): JSONObject | null {
    if (args.length === 0) {
      return null;
    }

    const visitedArgs = args.map((arg) => ({
      arg,
      visited: expression.visit(arg),
    }));

    const max = visitedArgs.reduce((max, current) => {
      const type = getType(current.visited);
      if (type !== 'string' && type !== 'number') {
        throw new JMESPathTypeError({
          currentValue: current.visited,
          expectedTypes: ['string'],
          actualType: type,
        });
      }

      if (max.visited === current.visited) {
        return max;
      } else {
        // We can safely cast visited to number | string here because we've already
        // checked the type at runtime above and we know that it's either a number or a string
        return (max.visited as number | string) >
          (current.visited as number | string)
          ? max
          : current;
      }
    }, visitedArgs[0]);

    return max.arg;
  }

  /**
   * Merge the provided objects into a single object.
   *
   * Note that this is a shallow merge and will not merge nested objects.
   *
   * @param args The objects to merge
   */
  @Functions.signature({
    argumentsSpecs: [['object']],
    variadic: true,
  })
  public funcMerge(...args: Array<JSONObject>): JSONObject {
    return args.reduce((a, b) => ({ ...a, ...b }), {});
  }

  /**
   * Get the minimum value in the provided array.
   *
   * @param arg The array to get the minimum value of
   */
  @Functions.signature({
    argumentsSpecs: [['array-number', 'array-string']],
  })
  public funcMin(arg: Array<number>): number | string | null {
    if (arg.length === 0) {
      return null;
      // The signature decorator already enforces that all elements are of the same type
    } else if (isNumber(arg[0])) {
      return Math.min(...arg);
    } else {
      return arg.reduce((a, b) => (a < b ? a : b));
    }
  }

  /**
   * Get the item in the provided array that has the minimum value when the provided expression is evaluated.
   *
   * @param args The array of items to get the minimum value of
   * @param expression The expression to evaluate for each item in the array
   */
  @Functions.signature({
    argumentsSpecs: [['array'], ['expression']],
  })
  public funcMinBy(
    args: Array<JSONObject>,
    expression: Expression
  ): JSONObject | null {
    if (args.length === 0) {
      return null;
    }

    const visitedArgs = args.map((arg) => ({
      arg,
      visited: expression.visit(arg),
    }));

    const min = visitedArgs.reduce((min, current) => {
      const type = getType(current.visited);
      if (type !== 'string' && type !== 'number') {
        throw new JMESPathTypeError({
          currentValue: current.visited,
          expectedTypes: ['string'],
          actualType: type,
        });
      }

      if (min.visited === current.visited) {
        return min;
      } else {
        // We can safely cast visited to number | string here because we've already
        // checked the type at runtime above and we know that it's either a number or a string
        return (min.visited as string | number) <
          (current.visited as string | number)
          ? min
          : current;
      }
    }, visitedArgs[0]);

    return min.arg;
  }

  /**
   * Get the first argument that does not evaluate to null.
   * If all arguments evaluate to null, then null is returned.
   *
   * @param args The keys of the items to check
   */
  @Functions.signature({
    argumentsSpecs: [[]],
    variadic: true,
  })
  public funcNotNull(...args: Array<JSONValue>): JSONValue | null {
    return args.find((arg) => !Object.is(arg, null)) || null;
  }

  /**
   * Reverses the provided string or array.
   *
   * @param arg The string or array to reverse
   */
  @Functions.signature({
    argumentsSpecs: [['string', 'array']],
  })
  public funcReverse(arg: string | Array<unknown>): string | Array<unknown> {
    return Array.isArray(arg)
      ? arg.reverse()
      : arg.split('').reverse().join('');
  }

  /**
   * Sort the provided array.
   *
   * @param arg The array to sort
   */
  @Functions.signature({
    argumentsSpecs: [['array-number', 'array-string']],
  })
  public funcSort(arg: Array<string> | Array<number>): Array<unknown> {
    return arg.sort((a: string | number, b: string | number): number => {
      if (typeof a === 'string') {
        // We can safely cast a and b to string here because the signature decorator
        // already enforces that all elements are of the same type
        return a.localeCompare(b as string);
      }

      // We can safely cast a and b to number here because the signature decorator
      // already enforces that all elements are of the same type, so if they're not strings
      // then they must be numbers
      return (a as number) - (b as number);
    });
  }

  /**
   * Sort the provided array by the provided expression.
   *
   * @param args The array to sort
   * @param expression The expression to sort by
   */
  @Functions.signature({
    argumentsSpecs: [['array'], ['expression']],
  })
  public funcSortBy(
    args: Array<JSONValue>,
    expression: Expression
  ): Array<unknown> {
    return args
      .map((value, index) => {
        const visited = expression.visit(value);
        const type = getType(visited);
        if (type !== 'string' && type !== 'number') {
          throw new JMESPathTypeError({
            currentValue: visited,
            expectedTypes: ['string'],
            actualType: getType(visited),
          });
        }

        return {
          value,
          index,
          visited,
        };
      })
      .sort((a, b) => {
        if (a.visited === b.visited) {
          return a.index - b.index; // Make the sort stable
        } else {
          // We can safely cast visited to number | string here because we've already
          // checked the type at runtime above and we know that it's either a number or a string
          return (a.visited as string | number) > (b.visited as string | number)
            ? 1
            : -1;
        }
      })
      .map(({ value }) => value); // Extract the original values
  }

  /**
   * Determines if the provided string starts with the provided prefix.
   *
   * @param str The string to check
   * @param prefix The prefix to check for
   */
  @Functions.signature({
    argumentsSpecs: [['string'], ['string']],
  })
  public funcStartsWith(str: string, prefix: string): boolean {
    return str.startsWith(prefix);
  }

  /**
   * Sum the provided numbers.
   *
   * @param args The numbers to sum
   */
  @Functions.signature({
    argumentsSpecs: [['array-number']],
  })
  public funcSum(args: Array<number>): number {
    return args.reduce((a, b) => a + b, 0);
  }

  /**
   * Convert the provided value to an array.
   *
   * If the provided value is an array, then it is returned.
   * Otherwise, the value is wrapped in an array and returned.
   *
   * @param arg The items to convert to an array
   */
  @Functions.signature({
    argumentsSpecs: [['any']],
  })
  public funcToArray(
    arg: JSONArray | Array<JSONValue>
  ): Array<JSONValue> | JSONArray {
    return Array.isArray(arg) ? arg : [arg];
  }

  /**
   * Convert the provided value to a number.
   *
   * If the provided value is a number, then it is returned.
   * Otherwise, the value is converted to a number and returned.
   *
   * If the value cannot be converted to a number, then null is returned.
   *
   * @param arg The value to convert to a number
   */
  @Functions.signature({
    argumentsSpecs: [['any']],
  })
  public funcToNumber(arg: JSONValue): number | null {
    if (typeof arg === 'number') {
      return arg;
    } else if (typeof arg === 'string') {
      const num = Number(arg);

      return Number.isNaN(num) ? null : num;
    } else {
      return null;
    }
  }

  /**
   * Convert the provided value to a string.
   *
   * If the provided value is a string, then it is returned.
   * Otherwise, the value is converted to a string and returned.
   *
   * @param arg The value to convert to a string
   */
  @Functions.signature({
    argumentsSpecs: [['any']],
  })
  public funcToString(arg: JSONValue): string {
    return typeof arg === 'string' ? arg : JSON.stringify(arg);
  }

  /**
   * Get the type of the provided value.
   *
   * @param arg The value to check the type of
   */
  @Functions.signature({
    argumentsSpecs: [['any']],
  })
  public funcType(arg: JSONValue): string {
    return getType(arg);
  }

  /**
   * Get the values of the provided object.
   *
   * @param arg The object to get the values of
   */
  @Functions.signature({
    argumentsSpecs: [['object']],
  })
  public funcValues(arg: JSONObject): JSONValue[] {
    return Object.values(arg);
  }

  public introspectMethods(scope?: Functions): Set<string> {
    const prototype = Object.getPrototypeOf(this);
    const ownName = prototype.constructor.name;
    const methods = new Set<string>();
    if (ownName !== 'Functions') {
      for (const method of prototype.introspectMethods(scope)) {
        methods.add(method);
      }
    }

    // This block is executed for every class in the inheritance chain
    for (const method of Object.getOwnPropertyNames(
      Object.getPrototypeOf(this)
    )) {
      method !== 'constructor' &&
        method.startsWith('func') &&
        methods.add(method);
    }

    // This block will be executed only if the scope is the outermost class
    if (this.methods) {
      for (const method of methods) {
        this.methods.add(method);
      }
    }

    return methods;
  }

  /**
   * Decorator to enforce the signature of a function at runtime.
   *
   * The signature decorator enforces the arity and types of the arguments
   * passed to a function at runtime. If the arguments do not match the
   * expected arity or types errors are thrown.
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
   * @param options The options for the signature decorator
   */
  public static signature(
    options: FunctionSignatureOptions
  ): FunctionSignatureDecorator {
    return (_target, _propertyKey, descriptor) => {
      const originalMethod = descriptor.value;

      // Use a function() {} instead of an () => {} arrow function so that we can
      // access `myClass` as `this` in a decorated `myClass.myMethod()`.
      descriptor.value = function (args: unknown[]) {
        const { variadic, argumentsSpecs } = options;
        arityCheck(args, argumentsSpecs, variadic);
        typeCheck(args, argumentsSpecs);

        return originalMethod.apply(this, args);
      };

      return descriptor;
    };
  }
}

export { Functions };

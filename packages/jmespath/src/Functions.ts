import type { JSONArray, JSONValue } from './types';

/**
 * TODO: validate SignatureDecorator type and extract to a separate file
 */
type SignatureDecorator = (
  target: Functions,
  propertyKey: string | symbol,
  descriptor: PropertyDescriptor
) => void;

/**
 * TODO: validate SignatureOptions type and extract to a separate file
 */
type SignatureOptions = {
  argumentsSpecs: Array<Array<string>>;
  variadic?: boolean;
};

/**
 * TODO: write docs for Functions
 */
class Functions {
  // TODO: find a type for FUNCTION_TABLE
  public FUNCTION_TABLE: Map<string, unknown> = new Map();

  /**
   * Get the absolute value of the provided number.
   *
   * @param args The number to get the absolute value of
   * @returns The absolute value of the number
   */
  public funcAbs(args: number): number {
    return Math.abs(args);
  }

  /**
   * Calculate the average of the numbers in the provided array.
   *
   * @param args The numbers to average
   * @returns The average of the numbers
   */
  public funcAvg(args: Array<number>): number {
    return args.reduce((a, b) => a + b, 0) / args.length;
  }

  /**
   * Get the first argument that does not evaluate to null.
   * If all arguments evaluate to null, then null is returned.
   *
   * @param args The keys of the items to check
   * @returns The first key that is not null or null if all keys are null
   */
  public funcNotNull(args: Array<JSONValue>): JSONValue | null {
    return args.find((arg) => !Object.is(arg, null)) || null;
  }

  /**
   * Convert the provided value to an array.
   *
   * If the provided value is an array, then it is returned.
   * Otherwise, the value is wrapped in an array and returned.
   *
   * @param args The items to convert to an array
   * @returns The items as an array
   */
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
   * @returns The value as a number or null if the value cannot be converted to a number
   */
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
   * @returns The value as a string
   */
  public funcToString(arg: JSONValue): string {
    return typeof arg === 'string' ? arg : JSON.stringify(arg);
  }

  /**
   * TODO: write docs for Functions.signature()
   *
   * @param options
   * @returns
   */
  public signature(options: SignatureOptions): SignatureDecorator {
    return (_target, _propertyKey, descriptor) => {
      const originalMethod = descriptor.value;
      if (typeof originalMethod !== 'function') {
        throw new TypeError('Only methods can be decorated with @signature.');
      }
      const methodName = originalMethod.name;

      // We need to use `functionsRef` instead of `this` because we want to
      // access other methods on the class from within the decorated method.
      // eslint-disable-next-line @typescript-eslint/no-this-alias
      const functionsRef = this;

      // Use a function() {} instead of an () => {} arrow function so that we can
      // access `myClass` as `this` in a decorated `myClass.myMethod()`.
      descriptor.value = function (args: unknown[]) {
        const { variadic, argumentsSpecs } = options;
        if (variadic) {
          if (args.length < argumentsSpecs.length) {
            // TODO: throw VariadictArityError
            /* raise exceptions.VariadictArityError(
              len(signature), len(args), function_name) */
          }
        } else if (args.length !== argumentsSpecs.length) {
          // TODO: throw ArityError
          /* raise exceptions.ArityError(
            len(signature), len(args), function_name) */
        }

        functionsRef.#typeCheck(args, argumentsSpecs, methodName);

        return originalMethod.apply(args);
      };

      return descriptor;
    };
  }

  /**
   * TODO: write docs for Functions.#typeCheck()
   * @param args
   * @param argumentsSpecs
   * @param name
   */
  #typeCheck(
    args: unknown[],
    argumentsSpecs: Array<Array<string>>,
    decoratedFuncName: string
  ): void {
    argumentsSpecs.forEach((argumentSpec, index) => {
      this.#typeCheckArgument(args[index], argumentSpec, decoratedFuncName);
    });
  }

  /**
   * TODO: write docs for Functions.#typeCheckArgument()
   *
   * Type checking at runtime involves checking the top level type,
   * and in the case of arrays, potentially checking the types of
   * the elements in the array.
   *
   * @param arg
   * @param argumentSpec
   * @param decoratedFuncName
   */
  #typeCheckArgument(
    arg: unknown,
    argumentSpec: Array<string>,
    decoratedFuncName: string
  ): void {}
}

export { Functions };

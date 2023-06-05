import type { JSONArray, JSONValue } from '../types';
import { typeCheck, arityCheck } from './typeChecking';

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
  @Functions.signature({ argumentsSpecs: [['number']] })
  public funcAbs(args: number): number {
    return Math.abs(args);
  }

  /**
   * Calculate the average of the numbers in the provided array.
   *
   * @param args The numbers to average
   * @returns The average of the numbers
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
   * @returns The ceiling of the number
   */
  @Functions.signature({ argumentsSpecs: [['number']] })
  public funcCeil(args: number): number {
    return Math.ceil(args);
  }

  /**
   * Determine if the provided value is contained in the provided item.
   * TODO: write docs for funcContains()
   */
  @Functions.signature({
    argumentsSpecs: [['array', 'string'], ['any']],
  })
  public funcContains(haystack: string, needle: string): boolean {
    // TODO: review this implementation
    return haystack.includes(needle);
  }

  /**
   * Determines if the provided string ends with the provided suffix.
   *
   * @param args The string to check
   * @returns True if the string ends with the suffix, false otherwise
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
   * @returns The floor of the number
   */
  @Functions.signature({ argumentsSpecs: [['number']] })
  public funcFloor(args: number): number {
    return Math.floor(args);
  }

  /**
   * Get the number of items in the provided item.
   *
   * @param args The array to get the length of
   * @returns The length of the array
   */
  @Functions.signature({
    argumentsSpecs: [['array', 'string']],
  })
  public funcLength(arg: string | Array<unknown>): number {
    return arg.length;
  }

  /**
   * Get the first argument that does not evaluate to null.
   * If all arguments evaluate to null, then null is returned.
   *
   * @param args The keys of the items to check
   * @returns The first key that is not null or null if all keys are null
   */
  @Functions.signature({
    argumentsSpecs: [[]],
    variadic: true,
  })
  public funcNotNull(args: Array<JSONValue>): JSONValue | null {
    return args.find((arg) => !Object.is(arg, null)) || null;
  }

  /**
   * Reverses the provided string or array.
   *
   * @param args The string or array to reverse
   * @returns The reversed string or array
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
   * Determines if the provided string starts with the provided suffix.
   *
   * @param args The string to check
   * @returns True if the string ends with the suffix, false otherwise
   */
  @Functions.signature({
    argumentsSpecs: [['string'], ['string']],
  })
  public funcStartsWith(str: string, suffix: string): boolean {
    return str.startsWith(suffix);
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
  public static signature(options: SignatureOptions): SignatureDecorator {
    return (_target, _propertyKey, descriptor) => {
      const originalMethod = descriptor.value;
      if (typeof originalMethod !== 'function') {
        throw new TypeError('Only methods can be decorated with @signature.');
      }
      const methodName = originalMethod.name;

      // Use a function() {} instead of an () => {} arrow function so that we can
      // access `myClass` as `this` in a decorated `myClass.myMethod()`.
      descriptor.value = function (args: unknown[]) {
        const { variadic, argumentsSpecs } = options;
        arityCheck(args, argumentsSpecs, methodName, variadic);
        typeCheck(args, argumentsSpecs, methodName);

        return originalMethod.apply(this, args);
      };

      return descriptor;
    };
  }
}

export { Functions };

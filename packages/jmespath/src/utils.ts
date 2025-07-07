import {
  getType,
  isIntegerNumber,
  isNumber,
  isRecord,
  isTruthy as isTruthyJS,
} from '@aws-lambda-powertools/commons/typeutils';
import { Expression } from './Expression.js';
import { ArityError, JMESPathTypeError, VariadicArityError } from './errors.js';

/**
 * Check if a value is truthy.
 *
 * In JavaScript, zero is falsy while all other non-zero numbers are truthy.
 * In JMESPath however, zero is truthy as well as all other non-zero numbers. For
 * this reason we wrap the original isTruthy function from the commons package
 * and add a check for numbers.
 *
 * @param value The value to check
 */
const isTruthy = (value: unknown): boolean => {
  if (isNumber(value)) {
    return true;
  }
  return isTruthyJS(value);
};

/**
 * @internal
 * Cap a slice range value to the length of an array, taking into account
 * negative values and whether the step is negative.
 *
 * @param arrayLength The length of the array
 * @param value The value to cap
 * @param isStepNegative Whether the step is negative
 */
const capSliceRange = (
  arrayLength: number,
  value: number,
  isStepNegative: boolean
): number => {
  let capValue = value;
  if (capValue < 0) {
    capValue += arrayLength;
    if (capValue < 0) {
      capValue = isStepNegative ? -1 : 0;
    }
  } else if (capValue >= arrayLength) {
    capValue = isStepNegative ? arrayLength - 1 : arrayLength;
  }

  return capValue;
};

/**
 * Given a start, stop, and step value, the sub elements in an array are extracted as follows:
 * * The first element in the extracted array is the index denoted by start.
 * * The last element in the extracted array is the index denoted by end - 1.
 * * The step value determines how many indices to skip after each element is selected from the array. An array of 1 (the default step) will not skip any indices. A step value of 2 will skip every other index while extracting elements from an array. A step value of -1 will extract values in reverse order from the array.
 *
 * Slice expressions adhere to the following rules:
 * * If a negative start position is given, it is calculated as the total length of the array plus the given start position.
 * * If no start position is given, it is assumed to be 0 if the given step is greater than 0 or the end of the array if the given step is less than 0.
 * * If a negative stop position is given, it is calculated as the total length of the array plus the given stop position.
 * * If no stop position is given, it is assumed to be the length of the array if the given step is greater than 0 or 0 if the given step is less than 0.
 * * If the given step is omitted, it it assumed to be 1.
 * * If the given step is 0, an invalid-value error MUST be raised (thrown before calling the function)
 * * If the element being sliced is not an array, the result is null (returned before calling the function)
 * * If the element being sliced is an array and yields no results, the result MUST be an empty array.
 *
 * @param array The array to slice
 * @param start The start index
 * @param end The end index
 * @param step The step value
 */
const sliceArray = <T>({
  array,
  start,
  end,
  step,
}: {
  array: T[];
  start?: number;
  end?: number;
  step: number;
}): T[] | null => {
  const isStepNegative = step < 0;
  const length = array.length;
  const defaultStart = isStepNegative ? length - 1 : 0;
  const defaultEnd = isStepNegative ? -1 : length;

  start = isIntegerNumber(start)
    ? capSliceRange(length, start, isStepNegative)
    : defaultStart;

  end = isIntegerNumber(end)
    ? capSliceRange(length, end, isStepNegative)
    : defaultEnd;

  const result: T[] = [];
  if (step > 0) {
    for (let i = start; i < end; i += step) {
      result.push(array[i]);
    }
  } else {
    for (let i = start; i > end; i += step) {
      result.push(array[i]);
    }
  }

  return result;
};

/**
 * Checks if the number of arguments passed to a function matches the expected arity.
 * If the number of arguments does not match the expected arity, an ArityError is thrown.
 *
 * If the function is variadic, then the number of arguments passed to the function must be
 * greater than or equal to the expected arity. If the number of arguments passed to the function
 * is less than the expected arity, a `VariadicArityError` is thrown.
 *
 * @param args The arguments passed to the function
 * @param argumentsSpecs The expected types for each argument
 * @param decoratedFuncName The name of the function being called
 * @param variadic Whether the function is variadic
 */
const arityCheck = (
  args: unknown[],
  argumentsSpecs: Array<Array<string>>,
  variadic?: boolean
): void => {
  if (variadic) {
    if (args.length < argumentsSpecs.length) {
      throw new VariadicArityError({
        expectedArity: argumentsSpecs.length,
        actualArity: args.length,
      });
    }
  } else if (args.length !== argumentsSpecs.length) {
    throw new ArityError({
      expectedArity: argumentsSpecs.length,
      actualArity: args.length,
    });
  }
};

/**
 * Type checks the arguments passed to a function against the expected types.
 *
 * Type checking at runtime involves checking the top level type,
 * and in the case of arrays, potentially checking the types of
 * the elements in the array.
 *
 * If the list of types includes 'any', then the type check is a
 * no-op.
 *
 * If the list of types includes more than one type, then the
 * argument is checked against each type in the list. If the
 * argument matches any of the types, then the type check
 * passes. If the argument does not match any of the types, then
 * a JMESPathTypeError is thrown.
 *
 * @param args The arguments passed to the function
 * @param argumentsSpecs The expected types for each argument
 */
const typeCheck = (
  args: unknown[],
  argumentsSpecs: Array<Array<string>>
): void => {
  for (const [index, argumentSpec] of argumentsSpecs.entries()) {
    if (argumentSpec[0] === 'any') continue;
    typeCheckArgument(args[index], argumentSpec);
  }
};

/**
 * Type checks an argument against a list of types.
 *
 * If the list of types includes more than one type, then the
 * argument is checked against each type in the list. If the
 * argument matches any of the types, then the type check
 * passes. If the argument does not match any of the types, then
 * a JMESPathTypeError is thrown.
 *
 * @param arg
 * @param argumentSpec
 */
const typeCheckArgument = (arg: unknown, argumentSpec: Array<string>): void => {
  let valid = false;
  argumentSpec.forEach((type, index) => {
    if (valid) return;
    valid = checkIfArgumentTypeIsValid(arg, type, index, argumentSpec);
  });
};

/**
 * Check if the argument is of the expected type.
 *
 * @param arg The argument to check
 * @param type The expected type
 * @param index The index of the type we are checking
 * @param argumentSpec The list of types to check against
 */
const checkIfArgumentTypeIsValid = (
  arg: unknown,
  type: string,
  index: number,
  argumentSpec: string[]
): boolean => {
  const hasMoreTypesToCheck = index < argumentSpec.length - 1;
  if (type.startsWith('array')) {
    if (!Array.isArray(arg)) {
      if (hasMoreTypesToCheck) {
        return false;
      }
      throw new JMESPathTypeError({
        currentValue: arg,
        expectedTypes: argumentSpec,
        actualType: getType(arg),
      });
    }
    checkComplexArrayType(arg, type, hasMoreTypesToCheck);

    return true;
  }
  if (type === 'expression') {
    checkExpressionType(arg, argumentSpec, hasMoreTypesToCheck);

    return true;
  }
  if (['string', 'number', 'boolean'].includes(type)) {
    typeCheckType(arg, type, argumentSpec, hasMoreTypesToCheck);
    if (typeof arg === type) return true;
  } else if (type === 'object') {
    checkObjectType(arg, argumentSpec, hasMoreTypesToCheck);

    return true;
  }

  return false;
};

/**
 * Check if the argument is of the expected type.
 *
 * @param arg The argument to check
 * @param type The type to check against
 * @param argumentSpec The list of types to check against
 * @param hasMoreTypesToCheck Whether there are more types to check
 */
const typeCheckType = (
  arg: unknown,
  type: string,
  argumentSpec: string[],
  hasMoreTypesToCheck: boolean
): void => {
  if (typeof arg !== type && !hasMoreTypesToCheck) {
    throw new JMESPathTypeError({
      currentValue: arg,
      expectedTypes: argumentSpec,
      actualType: getType(arg),
    });
  }
};

/**
 * Check if the argument is an array of complex types.
 *
 * @param arg The argument to check
 * @param type The type to check against
 * @param hasMoreTypesToCheck Whether there are more types to check
 */
const checkComplexArrayType = (
  arg: unknown[],
  type: string,
  hasMoreTypesToCheck: boolean
): void => {
  if (!type.includes('-')) return;
  const arrayItemsType = type.slice(6);
  let actualType: string | undefined;
  for (const element of arg) {
    try {
      typeCheckArgument(element, [arrayItemsType]);
      actualType = arrayItemsType;
    } catch (error) {
      if (!hasMoreTypesToCheck || actualType !== undefined) {
        throw error;
      }
    }
  }
};

/**
 * Check if the argument is an expression.
 *
 * @param arg The argument to check
 * @param type The type to check against
 * @param hasMoreTypesToCheck Whether there are more types to check
 */
const checkExpressionType = (
  arg: unknown,
  type: string[],
  hasMoreTypesToCheck: boolean
): void => {
  if (!(arg instanceof Expression) && !hasMoreTypesToCheck) {
    throw new JMESPathTypeError({
      currentValue: arg,
      expectedTypes: type,
      actualType: getType(arg),
    });
  }
};

/**
 * Check if the argument is an object.
 *
 * @param arg The argument to check
 * @param type The type to check against
 * @param hasMoreTypesToCheck Whether there are more types to check
 */
const checkObjectType = (
  arg: unknown,
  type: string[],
  hasMoreTypesToCheck: boolean
): void => {
  if (!isRecord(arg) && !hasMoreTypesToCheck) {
    throw new JMESPathTypeError({
      currentValue: arg,
      expectedTypes: type,
      actualType: getType(arg),
    });
  }
};

export { isTruthy, arityCheck, sliceArray, typeCheck, typeCheckArgument };

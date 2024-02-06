import { isRecord } from '../visitor/utils';
import { JMESPathTypeError, ArityError, VariadicArityError } from '../errors';

/**
 * TODO: write docs for arityCheck()
 *
 * @param args
 * @param argumentsSpecs
 * @param decoratedFuncName
 * @param variadic
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
 * TODO: write docs for typeCheck()
 * @param args
 * @param argumentsSpecs
 */
const typeCheck = (
  args: unknown[],
  argumentsSpecs: Array<Array<string>>
): void => {
  argumentsSpecs.forEach((argumentSpec, index) => {
    typeCheckArgument(args[index], argumentSpec);
  });
};

/**
 * Type checks an argument against a list of types.
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
 * @param arg
 * @param argumentSpec
 */
const typeCheckArgument = (arg: unknown, argumentSpec: Array<string>): void => {
  if (argumentSpec.length === 0 || argumentSpec[0] === 'any') {
    return;
  }
  const entryCount = argumentSpec.length;
  let hasMoreTypesToCheck = argumentSpec.length > 1;
  for (const [index, type] of argumentSpec.entries()) {
    hasMoreTypesToCheck = index < entryCount - 1;
    if (type.startsWith('array')) {
      if (!Array.isArray(arg)) {
        if (hasMoreTypesToCheck) {
          continue;
        }
        throw new JMESPathTypeError({
          currentValue: arg,
          expectedTypes: argumentSpec,
          actualType: Object.is(arg, null) ? 'null' : typeof arg,
        });
      }
      if (type.includes('-')) {
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
      }
      break;
    } else {
      if (type === 'string' || type === 'number' || type === 'boolean') {
        if (typeof arg !== type) {
          if (!hasMoreTypesToCheck) {
            throw new JMESPathTypeError({
              currentValue: arg,
              expectedTypes: argumentSpec,
              actualType: type === 'boolean' ? 'boolean' : typeof arg, // TODO: fix this
            });
          }
          continue;
        }
        break;
      } else if (type === 'null') {
        if (!Object.is(arg, null)) {
          if (!hasMoreTypesToCheck) {
            throw new JMESPathTypeError({
              currentValue: arg,
              expectedTypes: argumentSpec,
              actualType: typeof arg,
            });
          }
          continue;
        }
        break;
      } else if (type === 'object') {
        if (!isRecord(arg)) {
          if (index === entryCount - 1) {
            throw new JMESPathTypeError({
              currentValue: arg,
              expectedTypes: argumentSpec,
              actualType: typeof arg,
            });
          }
          continue;
        }
        break;
      }
    }
  }
};

export { arityCheck, typeCheck };

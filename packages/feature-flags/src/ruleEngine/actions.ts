import {
  isNumber,
  isStrictEqual,
  isString,
} from '@aws-lambda-powertools/commons';
import { RuleActions } from '../constants.js';
import type { Comparator, RuleAction } from './types.js';

/**
 * Compares two numbers or two strings without coercion.
 * @param context - Supply the context operand
 * @param value - Supply the document operand
 * @param comparator - Apply the ordering comparison
 * @internal
 */
const compareOrdered = (
  context: unknown,
  value: unknown,
  comparator: (left: number | string, right: number | string) => boolean
): boolean => {
  if (
    (isNumber(context) && isNumber(value)) ||
    (isString(context) && isString(value))
  ) {
    return comparator(context, value);
  }
  throw new TypeError('Incompatible operands');
};

/**
 * Compares two strings without coercion.
 * @param context - Supply the context operand
 * @param value - Supply the document operand
 * @param comparator - Apply the string comparison
 * @internal
 */
const compareStrings = (
  context: unknown,
  value: unknown,
  comparator: (left: string, right: string) => boolean
): boolean => {
  if (isString(context) && isString(value)) return comparator(context, value);
  throw new TypeError('Incompatible operands');
};

/**
 * Checks whether a value belongs to an array using strict JSON equality.
 * @param context - Supply the value to find
 * @param value - Supply the array to search
 * @internal
 */
const includes = (context: unknown, value: unknown): boolean => {
  if (!Array.isArray(value)) throw new TypeError('Incompatible operands');
  return value.some((entry) => isStrictEqual(context, entry));
};

/**
 * Compares two arrays using a supplied membership quantifier.
 * @param context - Supply the context array
 * @param value - Supply the document array
 * @param comparator - Apply the membership quantifier
 * @internal
 */
const compareArrays = (
  context: unknown,
  value: unknown,
  comparator: (
    matches: (entry: unknown) => boolean,
    entries: unknown[]
  ) => boolean
): boolean => {
  if (!Array.isArray(context) || !Array.isArray(value))
    throw new TypeError('Incompatible operands');
  return comparator((entry) => includes(entry, value), context);
};

/** Dispatches each supported Action to its strict comparator. @internal */
const actions: Record<RuleAction, Comparator> = {
  [RuleActions.EQUALS]: isStrictEqual,
  [RuleActions.NOT_EQUALS]: (context, value) => !isStrictEqual(context, value),
  [RuleActions.KEY_GREATER_THAN_VALUE]: (context, value) =>
    compareOrdered(context, value, (left, right) => left > right),
  [RuleActions.KEY_GREATER_THAN_OR_EQUAL_VALUE]: (context, value) =>
    compareOrdered(context, value, (left, right) => left >= right),
  [RuleActions.KEY_LESS_THAN_VALUE]: (context, value) =>
    compareOrdered(context, value, (left, right) => left < right),
  [RuleActions.KEY_LESS_THAN_OR_EQUAL_VALUE]: (context, value) =>
    compareOrdered(context, value, (left, right) => left <= right),
  [RuleActions.STARTSWITH]: (context, value) =>
    compareStrings(context, value, (left, right) => left.startsWith(right)),
  [RuleActions.ENDSWITH]: (context, value) =>
    compareStrings(context, value, (left, right) => left.endsWith(right)),
  [RuleActions.IN]: includes,
  [RuleActions.NOT_IN]: (context, value) => !includes(context, value),
  [RuleActions.KEY_IN_VALUE]: includes,
  [RuleActions.KEY_NOT_IN_VALUE]: (context, value) => !includes(context, value),
  [RuleActions.VALUE_IN_KEY]: (context, value) => includes(value, context),
  [RuleActions.VALUE_NOT_IN_KEY]: (context, value) => !includes(value, context),
  [RuleActions.ALL_IN_VALUE]: (context, value) =>
    compareArrays(context, value, (matches, entries) => entries.every(matches)),
  [RuleActions.ANY_IN_VALUE]: (context, value) =>
    compareArrays(context, value, (matches, entries) => entries.some(matches)),
  [RuleActions.NONE_IN_VALUE]: (context, value) =>
    compareArrays(context, value, (matches, entries) => !entries.some(matches)),
};

export { actions };

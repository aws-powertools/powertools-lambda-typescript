import {
  compareStringsByCodePoint,
  isNull,
  isNumber,
  isRecord,
  isStrictEqual,
  isString,
} from '@aws-lambda-powertools/commons';
import { RuleActions } from '../constants.js';
import type { Comparator, RuleAction } from './types.js';

/**
 * Compares numbers directly and strings by Unicode code point without coercion.
 * @param context - Supply the context operand
 * @param value - Supply the document operand
 * @param comparator - Compare numeric operands or a string order against zero
 * @internal
 */
const compareOrdered = (
  context: unknown,
  value: unknown,
  comparator: (left: number, right: number) => boolean
): boolean => {
  if (isNumber(context) && isNumber(value)) {
    return comparator(context, value);
  }
  if (isString(context) && isString(value)) {
    return comparator(compareStringsByCodePoint(context, value), 0);
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
 * Checks whether an array contains a value using strict JSON equality.
 * @param container - Supply the array to search
 * @param needle - Supply the value to find
 * @internal
 */
const containsArray = (container: unknown[], needle: unknown): boolean =>
  container.some((entry) => isStrictEqual(entry, needle));

/**
 * Checks whether a string contains a substring by Unicode code point.
 * @param container - Supply the string to search
 * @param needle - Supply the substring to find
 * @internal
 */
const containsSubstring = (container: string, needle: string): boolean => {
  if (needle === '') return true;
  // Iterate code points so a lone surrogate cannot match half of a surrogate pair.
  const containerCodePoints = Array.from(container);
  const needleCodePoints = Array.from(needle);
  for (const [index] of containerCodePoints.entries()) {
    if (
      needleCodePoints.every(
        (codePoint, offset) => codePoint === containerCodePoints[index + offset]
      )
    ) {
      return true;
    }
  }
  return false;
};

/**
 * Checks Python-style membership in arrays, own object keys, or strings.
 * @param container - Supply the array, object, or string to search
 * @param needle - Supply the value, key, or substring to find
 * @internal
 */
const contains = (container: unknown, needle: unknown): boolean => {
  if (Array.isArray(container)) return containsArray(container, needle);
  if (isRecord(container)) {
    if (isString(needle)) return Object.hasOwn(container, needle);
    if (isNumber(needle) || typeof needle === 'boolean' || isNull(needle))
      return false;
    throw new TypeError('Incompatible operands');
  }
  if (isString(container)) {
    if (!isString(needle)) throw new TypeError('Incompatible operands');
    return containsSubstring(container, needle);
  }
  throw new TypeError('Incompatible operands');
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
  return comparator((entry) => containsArray(value, entry), context);
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
  [RuleActions.IN]: (context, value) => contains(value, context),
  [RuleActions.NOT_IN]: (context, value) => !contains(value, context),
  [RuleActions.KEY_IN_VALUE]: (context, value) => contains(value, context),
  [RuleActions.KEY_NOT_IN_VALUE]: (context, value) => !contains(value, context),
  [RuleActions.VALUE_IN_KEY]: (context, value) => contains(context, value),
  [RuleActions.VALUE_NOT_IN_KEY]: (context, value) => !contains(context, value),
  [RuleActions.ALL_IN_VALUE]: (context, value) =>
    compareArrays(context, value, (matches, entries) => entries.every(matches)),
  [RuleActions.ANY_IN_VALUE]: (context, value) =>
    compareArrays(context, value, (matches, entries) => entries.some(matches)),
  [RuleActions.NONE_IN_VALUE]: (context, value) =>
    compareArrays(context, value, (matches, entries) => !entries.some(matches)),
};

export { actions };

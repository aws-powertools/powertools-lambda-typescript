import { isNumber, isString } from '@aws-lambda-powertools/commons';
import type { ContextScalar, ContextValue } from './types/index.js';

/**
 * Checks for a string, number, or boolean in context values and fallbacks.
 * @param value - Supply the value to check
 * @internal
 */
const isScalar = (value: unknown): value is ContextScalar =>
  isString(value) || isNumber(value) || typeof value === 'boolean';

/**
 * Checks finite scalar attributes and flat arrays, rejecting sparse arrays.
 * @param value - Supply the attribute value to check
 * @internal
 */
const isFiniteContextValue = (value: unknown): value is ContextValue => {
  const values = Array.isArray(value) ? Array.from(value) : [value];
  for (const entry of values) {
    if (
      !isScalar(entry) ||
      (typeof entry === 'number' && !Number.isFinite(entry))
    ) {
      return false;
    }
  }
  return true;
};

/**
 * Describes an invalid context value's kind without exposing its value.
 * @param value - Supply the invalid context value to describe
 * @internal
 */
const getInvalidContextKind = (value: unknown): string => {
  if (value === null) return 'null';
  if (Array.isArray(value)) {
    const offendingElement = Array.from(value).find(
      (element) => !isScalar(element)
    );
    return `an array containing ${getInvalidContextKind(offendingElement)}`;
  }
  return typeof value;
};

export { getInvalidContextKind, isFiniteContextValue, isScalar };

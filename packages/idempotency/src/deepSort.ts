import { getType } from '@aws-lambda-powertools/commons';
import type {
  JSONArray,
  JSONObject,
  JSONValue,
} from '@aws-lambda-powertools/commons/types';

/**
 * Compares two keys in a case-insensitive manner.
 *
 * Keys that are equal when lowercased (e.g. `a` and `A`) are ordered case-sensitively,
 * so the result does not depend on the order of the keys in the input. Object keys are
 * unique, so the comparator never receives two identical keys.
 *
 * @param a - the first key to compare
 * @param b - the second key to compare
 */
const compareKeys = (a: string, b: string): number => {
  const lowerA = a.toLowerCase();
  const lowerB = b.toLowerCase();
  if (lowerA !== lowerB) {
    return lowerA < lowerB ? -1 : 1;
  }

  return a < b ? -1 : 1;
};

/**
 * Sorts the keys of a provided object in a case-insensitive manner.
 *
 * This function takes an object as input, sorts its keys alphabetically without
 * considering case sensitivity and recursively sorts any nested objects or arrays.
 *
 * The sorted object is built with `Object.fromEntries` so that every own key of the
 * input, including `__proto__`, is kept as a regular property.
 *
 * @param {JSONObject} object - The JSON object to be sorted.
 * @returns {JSONObject} - A new JSON object with all keys sorted alphabetically in a case-insensitive manner.
 */
const sortObject = (object: JSONObject): JSONObject =>
  Object.fromEntries(
    Object.keys(object)
      .sort(compareKeys)
      .map((key) => [key, deepSort(object[key])])
  );

/**
 * Recursively sorts the keys of an object or elements of an array.
 *
 * This function sorts the keys of any JSON in a case-insensitive manner and recursively applies the same sorting to
 * nested objects and arrays. Primitives (strings, numbers, booleans, null) are returned unchanged.
 *
 * @param {JSONValue} data - The input data to be sorted, which can be an object, array or primitive value.
 * @returns {JSONValue} - The sorted data, with all object's keys sorted alphabetically in a case-insensitive manner.
 */
const deepSort = (data: JSONValue): JSONValue => {
  const type = getType(data);
  if (type === 'object') {
    return sortObject(data as JSONObject);
  }
  if (type === 'array') {
    return (data as JSONArray).map(deepSort);
  }

  return data;
};

export { deepSort };

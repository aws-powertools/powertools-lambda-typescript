import { getType } from '@aws-lambda-powertools/commons';
import type {
  JSONArray,
  JSONObject,
  JSONValue,
} from '@aws-lambda-powertools/commons/types';

/**
 * Sorts the keys of a provided object in a case-insensitive manner.
 *
 * This function takes an object as input, sorts its keys alphabetically without
 * considering case sensitivity and recursively sorts any nested objects or arrays.
 *
 * @param {JSONObject} object - The JSON object to be sorted.
 * @returns {JSONObject} - A new JSON object with all keys sorted alphabetically in a case-insensitive manner.
 */
const sortObject = (object: JSONObject): JSONObject =>
  Object.keys(object)
    .sort((a, b) => (a.toLowerCase() < b.toLowerCase() ? -1 : 1))
    .reduce((acc, key) => {
      acc[key] = deepSort(object[key]);

      return acc;
    }, {} as JSONObject);

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

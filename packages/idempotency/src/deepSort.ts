import { getType } from '@aws-lambda-powertools/commons';
import {
  JSONArray,
  JSONObject,
  JSONValue,
} from '@aws-lambda-powertools/commons/types';

const sortObject = (object: JSONObject): JSONObject => {
  return Object.keys(object)
    .sort((a, b) => (a.toLowerCase() < b.toLowerCase() ? -1 : 1))
    .reduce((acc, key) => {
      acc[key] = deepSort(object[key]);

      return acc;
    }, {} as JSONObject);
};

/**
 * Recursively sorts the keys of an object or elements of an array.
 *
 * This function sorts the keys of any JSON object in a case-insensitive manner,
 * and recursively applies the same sorting to nested objects and arrays.
 * Primitives (strings, numbers, booleans, null) are returned unchanged.
 *
 * @param {JSONValue} data - The input data to be sorted, which can be an object, array, or primitive value.
 * @returns {JSONValue} - The sorted data, with all objects' keys sorted alphabetically in a case-insensitive manner.
 */

const deepSort = (data: JSONValue): JSONValue => {
  const type = getType(data);
  if (type === 'object') {
    return sortObject(data as JSONObject);
  } else if (type === 'array') {
    return (data as JSONArray).map(deepSort);
  }

  return data;
};

export { deepSort };

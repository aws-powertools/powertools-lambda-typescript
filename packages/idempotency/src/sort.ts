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
      acc[key] = sort(object[key]);

      return acc;
    }, {} as JSONObject);
};

const sort = (data: JSONValue): JSONValue => {
  const type = getType(data);
  if (type === 'object') {
    return sortObject(data as JSONObject);
  } else if (type === 'array') {
    return (data as JSONArray).map(sort);
  }

  return data;
};

export { sort };

/**
 * TODO: write docs for isRecord() type guard
 *
 * @param value
 * @returns
 */
const isRecord = (value: unknown): value is Record<string, unknown> => {
  return (
    Object.prototype.toString.call(value) === '[object Object]' &&
    !Object.is(value, null)
  );
};

/**
 * TODO: write docs for isTruthy()
 * @param value
 * @returns
 */
const isTruthy = (value: unknown): boolean => {
  if (typeof value === 'string') {
    return value !== '';
  } else if (typeof value === 'number') {
    return value !== 0;
  } else if (typeof value === 'boolean') {
    return value;
  } else if (Array.isArray(value)) {
    return value.length > 0;
  } else if (isRecord(value)) {
    return Object.keys(value).length > 0;
  } else {
    return Object.is(value, true);
  }
};

/**
 * TODO: write docs for isNullOrUndefined()
 * @param value
 * @returns
 */
const isNullOrUndefined = (value: unknown): value is null | undefined => {
  return Object.is(value, null) || Object.is(value, undefined);
};

/**
 * TODO: write docs for isString()
 * @param value
 * @returns
 */
const isString = (value: unknown): value is string => {
  return typeof value === 'string';
};

export { isRecord, isString, isTruthy, isNullOrUndefined };

type JSONPrimitive = string | number | boolean | null | undefined;
type JSONValue = JSONPrimitive | JSONObject | JSONArray;
type JSONObject = { [key: string]: JSONValue };
type JSONArray = Array<JSONValue>;

export type { JSONPrimitive, JSONValue, JSONObject, JSONArray };

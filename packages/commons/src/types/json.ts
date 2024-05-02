/**
 * A type that represents base JSON primitives.
 */
type JSONPrimitive = string | number | boolean | null | undefined;
/**
 * A type that represents a JSON value.
 */
type JSONValue = JSONPrimitive | JSONObject | JSONArray;
/**
 * A type that represents a JSON object.
 */
type JSONObject = { [key: number | string]: JSONValue };
/**
 * A type that represents a JSON array.
 */
type JSONArray = Array<JSONValue>;

export type { JSONPrimitive, JSONValue, JSONObject, JSONArray };

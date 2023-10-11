type JSONPrimitive = string | number | boolean | null | undefined;
type JSONValue = JSONPrimitive | JSONObject | JSONArray;
type JSONObject = { [key: number | string]: JSONValue };
type JSONArray = Array<JSONValue>;

export type { JSONPrimitive, JSONValue, JSONObject, JSONArray };

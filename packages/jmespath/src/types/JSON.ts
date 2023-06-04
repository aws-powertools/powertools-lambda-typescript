type JSONPrimitive = string | number | boolean | null;
type JSONValue = JSONPrimitive | JSONObject | JSONArray;
type JSONObject = { [key: string]: JSONValue };
type JSONArray = Array<JSONValue>;

export { JSONPrimitive, JSONValue, JSONObject, JSONArray };

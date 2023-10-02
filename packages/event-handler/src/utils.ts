/** Key-Value pairs Type typically used for HTTP Headers, Query parameters, path parameters. */
type MapType = { [name: string]: string | undefined } | null;

/**
 * Looks up the value for the key from the provided key-value pairs
 *
 * @param map  key-value pair object
 * @param lookupKey the key that must be looked up in the key-value pair
 * @returns the value for the key
 *
 * @example
 * ```ts
 * const contentType = lookupKeyFromMap(response.headers, 'Content-Type')
 * ```
 *
 * @category General Use
 */
const lookupKeyFromMap = <T = string>(
  map: MapType,
  lookupKey: string
): T | undefined => {
  if (!map) return;
  const lowercaseLookupKey = lookupKey.toLowerCase();
  for (const [key, value] of Object.entries(map)) {
    if (key.toLowerCase() === lowercaseLookupKey) {
      return value as T;
    }
  }
};

export { MapType, lookupKeyFromMap };

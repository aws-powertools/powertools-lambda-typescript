import { readFileSync } from 'node:fs';
import { join } from 'node:path';

/**
 * Reads and parses a JSON file from the specified events path and filename, returning the parsed object.
 *
 * @template T - The expected type of the parsed JSON object.
 * @param {Object} params - The parameters for the function.
 * @param {string} params.eventsPath - The relative path to the directory containing the event files.
 * @param {string} params.filename - The name of the JSON file (without extension) to be read and parsed.
 */
const getTestEvent = <T extends Record<string, unknown>>({
  eventsPath,
  filename,
}: {
  eventsPath: string;
  filename: string;
}): T =>
  JSON.parse(
    readFileSync(
      join(__dirname, '..', '..', 'events', eventsPath, `${filename}.json`),
      'utf-8'
    )
  ) as T;

/**
 * Returns a new object with the specified keys omitted.
 *
 * @template T - The type of the object to omit keys from.
 * @template Keys - The keys to omit from the object.
 * @param {readonly Keys[]} keys - The keys to omit from the object.
 * @param {T} obj - The object to omit keys from.
 */
const omit = <T extends Record<string, unknown>, Keys extends keyof T>(
  keys: readonly Keys[],
  obj: T
): Omit<T, Keys> => {
  const result = { ...obj };

  for (const key of keys) {
    delete result[key];
  }

  return result;
};

export { getTestEvent, omit };

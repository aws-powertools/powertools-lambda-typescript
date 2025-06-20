import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { MSKEvent } from '../../src/types/types.js';

/**
 * Load a sample MSK event from a JSON file.
 *
 * @param fileName - The name of the file to load the event from.
 */
const loadEvent = (fileName: string) => {
  return JSON.parse(
    readFileSync(join(__dirname, '..', 'events', fileName), 'utf-8')
  ) as unknown as MSKEvent;
};

export { loadEvent };

import { readFileSync } from 'node:fs';
import { join } from 'node:path';

/**
 * Get a test event from the events directory
 */
export const getTestEvent = <T extends Record<string, unknown>>({
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

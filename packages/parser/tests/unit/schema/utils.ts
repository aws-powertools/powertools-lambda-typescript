import { readFileSync } from 'node:fs';

export const loadExampleEvent = (fileName: string): unknown => {
  const event = readFileSync(`./tests/events/${fileName}`, 'utf8');

  return JSON.parse(event);
};

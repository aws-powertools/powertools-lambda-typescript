import * as fs from 'fs';

export const loadExampleEvent = (fileName: string): unknown => {
  try {
    const event = fs.readFileSync(`tests/events/${fileName}`, 'utf8');

    return JSON.parse(event);
  } catch (err) {
    console.error(err);
  }
};

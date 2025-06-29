import { randomUUID } from 'node:crypto';

/**
 * ID - A unique identifier for an object. This scalar is serialized like a String
 * but isn't meant to be human-readable.
 */
export const makeId = () => randomUUID();

/**
 * AWSTimestamp - An integer value representing the number of seconds
 * before or after 1970-01-01-T00:00Z.
 */
export const awsTimestamp = () => Math.floor(Date.now() / 1000);

/**
 * AWSDate - An extended ISO 8601 date string in the format YYYY-MM-DD.
 *
 * @param timezoneOffset - Timezone offset in hours, defaults to 0
 */
export const awsDate = (timezoneOffset = 0) =>
  formattedTime(new Date(), '%Y-%m-%d', timezoneOffset);

/**
 * AWSTime - An extended ISO 8601 time string in the format hh:mm:ss.sss.
 *
 * @param timezoneOffset - Timezone offset in hours, defaults to 0
 */
export const awsTime = (timezoneOffset = 0) =>
  formattedTime(new Date(), '%H:%M:%S.%f', timezoneOffset);

/**
 * AWSDateTime - An extended ISO 8601 date and time string in the format
 * YYYY-MM-DDThh:mm:ss.sssZ.
 *
 * @param timezoneOffset - Timezone offset in hours, defaults to 0
 */
export const awsDateTime = (timezoneOffset = 0) =>
  formattedTime(new Date(), '%Y-%m-%dT%H:%M:%S.%f', timezoneOffset);

/**
 * String formatted time with optional timezone offset
 *
 * @param now - Current Date object with zero timezone offset
 * @param format - Date format function to apply before adding timezone offset
 * @param timezoneOffset - Timezone offset in hours, defaults to 0
 */
const formattedTime = (
  now: Date,
  format: string,
  timezoneOffset: number
): string => {
  if (timezoneOffset < -12 || timezoneOffset > 14) {
    // Reference: https://en.wikipedia.org/wiki/List_of_UTC_offsets
    throw new RangeError(
      'timezoneOffset must be between -12 and +14 (inclusive)'
    );
  }
  const adjustedDate = new Date(
    now.getTime() + timezoneOffset * 60 * 60 * 1000
  );

  const formattedDateParts: Record<string, string> = {
    '%Y': adjustedDate.getUTCFullYear().toString(),
    '%m': (adjustedDate.getUTCMonth() + 1).toString().padStart(2, '0'),
    '%d': adjustedDate.getUTCDate().toString().padStart(2, '0'),
    '%H': adjustedDate.getUTCHours().toString().padStart(2, '0'),
    '%M': adjustedDate.getUTCMinutes().toString().padStart(2, '0'),
    '%S': adjustedDate.getUTCSeconds().toString().padStart(2, '0'),
    '.%f': `.${adjustedDate.getUTCMilliseconds().toString().padStart(3, '0')}`,
  };

  const dateTimeStr = format.replace(
    /%Y|%m|%d|%H|%M|%S|\.%f/g,
    (match) => formattedDateParts[match]
  );

  let postfix: string;
  if (timezoneOffset === 0) {
    postfix = 'Z';
  } else {
    const sign = timezoneOffset > 0 ? '+' : '-';
    const absOffset = Math.abs(timezoneOffset);
    const hours = Math.floor(absOffset);
    const minutes = Math.floor((absOffset - hours) * 60);
    postfix = `${sign}${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:00`;
  }

  return `${dateTimeStr}${postfix}`;
};

import { isRecord, isString } from '@aws-lambda-powertools/commons';
import { TimeDays } from '../constants.js';
import type {
  DatetimeRange,
  DaysOfWeek,
  ModuloRange,
  TimeRange,
} from '../types/RuleEngine.js';
import { parseNaiveDatetime } from './datetime.js';

/**
 * Identifies invalid optional IANA zones without throwing or exposing values.
 * @param timezone - Supply the optional document timezone
 * @internal
 */
const getTimezoneError = (timezone: unknown): string | null => {
  if (timezone === undefined) return null;
  if (!isString(timezone)) return 'TIMEZONE must be a string';
  try {
    // Intl accepts fixed-offset identifiers, but schedules require named IANA zones.
    if (/^[+-]/.test(timezone)) return 'TIMEZONE must be a valid IANA timezone';
    new Intl.DateTimeFormat('en-US', { timeZone: timezone });
    return null;
  } catch {
    return 'TIMEZONE must be a valid IANA timezone';
  }
};

/**
 * Identifies malformed modulo objects, integer fields, and inclusive bounds.
 * @param value - Supply the document operand
 * @internal
 */
const getModuloRangeError = (value: unknown): string | null => {
  if (!isRecord(value))
    return 'value must be an object with BASE, START, and END';
  const { BASE: base, START: start, END: end } = value;
  if (
    typeof base !== 'number' ||
    !Number.isInteger(base) ||
    typeof start !== 'number' ||
    !Number.isInteger(start) ||
    typeof end !== 'number' ||
    !Number.isInteger(end)
  )
    return 'BASE, START, and END must be integers';
  // Integer END < BASE avoids rounding BASE - 1 while enforcing the same bound.
  if (!(0 <= start && start <= end && end < base))
    return 'must satisfy 0 <= START <= END <= BASE - 1';
  return null;
};

/**
 * Identifies malformed schedule objects, bounds, and optional timezones.
 * @param value - Supply the document operand
 * @param validateBound - Check one bound's format
 * @param boundError - Identify a malformed bound without its value
 * @internal
 */
const getRangeError = (
  value: unknown,
  validateBound: (bound: unknown) => boolean,
  boundError: string
): string | null => {
  if (!isRecord(value)) return 'value must be an object';
  for (const bound of [value.START, value.END]) {
    if (!validateBound(bound)) return boundError;
  }
  return getTimezoneError(value.TIMEZONE);
};

/**
 * Identifies malformed anchored HH:MM bounds or optional IANA zones.
 * @param value - Supply the document operand
 * @internal
 */
const getTimeRangeError = (value: unknown): string | null =>
  getRangeError(
    value,
    (bound) =>
      isString(bound) &&
      bound.length === 5 &&
      /^(?:2[0-3]|[01]\d):[0-5]\d$/.test(bound),
    'START and END must use HH:MM'
  );

/**
 * Identifies malformed naive ISO bounds or optional IANA zones.
 * @param value - Supply the document operand
 * @internal
 */
const getDatetimeRangeError = (value: unknown): string | null =>
  getRangeError(
    value,
    (bound) => parseNaiveDatetime(bound) !== null,
    'START and END must use timezone-naive ISO8601'
  );

/**
 * Identifies malformed Python day lists or optional IANA zones.
 * @param value - Supply the document operand
 * @internal
 */
const getDaysOfWeekError = (value: unknown): string | null => {
  if (!isRecord(value)) return 'value must be an object';
  if (
    !Array.isArray(value.DAYS) ||
    value.DAYS.some(
      (day) => !isString(day) || !TimeDays.some((validDay) => validDay === day)
    )
  )
    return 'DAYS must be an array of Python day names';
  return getTimezoneError(value.TIMEZONE);
};

/**
 * Narrows complete modulo shapes using the same rules as document validation.
 * @param value - Supply the operand to check
 * @internal
 */
const isModuloRange = (value: unknown): value is ModuloRange =>
  getModuloRangeError(value) === null;

/**
 * Narrows complete time-range shapes, including anchored bounds and valid zones.
 * @param value - Supply the operand to check
 * @internal
 */
const isTimeRange = (value: unknown): value is TimeRange =>
  getTimeRangeError(value) === null;

/**
 * Narrows complete datetime-range shapes, including naive ISO bounds and valid zones.
 * @param value - Supply the operand to check
 * @internal
 */
const isDatetimeRange = (value: unknown): value is DatetimeRange =>
  getDatetimeRangeError(value) === null;

/**
 * Narrows complete day-list shapes, including Python names and valid zones.
 * @param value - Supply the operand to check
 * @internal
 */
const isDaysOfWeek = (value: unknown): value is DaysOfWeek =>
  getDaysOfWeekError(value) === null;

export {
  getDatetimeRangeError,
  getDaysOfWeekError,
  getModuloRangeError,
  getTimeRangeError,
  isDatetimeRange,
  isDaysOfWeek,
  isModuloRange,
  isTimeRange,
};

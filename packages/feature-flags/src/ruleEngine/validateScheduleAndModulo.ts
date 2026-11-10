import { isRecord, isString } from '@aws-lambda-powertools/commons';
import type { JSONValue } from '@aws-lambda-powertools/commons/types';
import { RuleActions, TimeActionKeys, TimeDays } from '../constants.js';
import { SchemaValidationError } from '../errors.js';
import { parseNaiveDatetime } from './datetime.js';
import { isTimeAction } from './time.js';
import type { RuleAction } from './types.js';

/**
 * Validates an optional IANA timezone before evaluation can read the clock.
 * @param timezone - Supply the optional document timezone
 * @param location - Identify the Condition without values
 * @internal
 */
const validateTimezone = (timezone: unknown, location: string): void => {
  if (timezone === undefined) return;
  if (!isString(timezone))
    throw new SchemaValidationError(`${location} TIMEZONE must be a string`);
  try {
    // Intl also accepts fixed-offset identifiers; schedules require named IANA zones.
    if (/^[+-]/.test(timezone))
      throw new RangeError('Expected a named timezone');
    new Intl.DateTimeFormat('en-US', { timeZone: timezone });
  } catch {
    throw new SchemaValidationError(
      `${location} TIMEZONE must be a valid IANA timezone`
    );
  }
};

/**
 * Validates schedule keys, time/day bounds, zones, and modulo integer bounds.
 * @param action - Supply the validated Action name
 * @param key - Supply the context or clock key
 * @param value - Supply the JSON document operand
 * @param location - Identify the Condition without operand values
 * @internal
 */
const validateScheduleAndModulo = (
  action: RuleAction,
  key: string,
  value: JSONValue,
  location: string
): void => {
  if (action === RuleActions.MODULO_RANGE) {
    if (!isRecord(value))
      throw new SchemaValidationError(
        `${location} value must be an object with BASE, START, and END`
      );
    const { BASE: base, START: start, END: end } = value;
    if (
      typeof base !== 'number' ||
      !Number.isInteger(base) ||
      typeof start !== 'number' ||
      !Number.isInteger(start) ||
      typeof end !== 'number' ||
      !Number.isInteger(end)
    )
      throw new SchemaValidationError(
        `${location} BASE, START, and END must be integers`
      );
    // For integers, END < BASE is equivalent to END <= BASE - 1 without rounding BASE - 1.
    if (!(0 <= start && start <= end && end < base))
      throw new SchemaValidationError(
        `${location} must satisfy 0 <= START <= END <= BASE - 1`
      );
    return;
  }
  if (!isTimeAction(action)) return;
  if (key !== TimeActionKeys[action])
    throw new SchemaValidationError(
      `${location} key must be ${TimeActionKeys[action]}`
    );
  if (!isRecord(value))
    throw new SchemaValidationError(`${location} value must be an object`);
  if (action === RuleActions.SCHEDULE_BETWEEN_DAYS_OF_WEEK) {
    if (
      !Array.isArray(value.DAYS) ||
      value.DAYS.some(
        (day) =>
          !isString(day) || !TimeDays.some((validDay) => validDay === day)
      )
    )
      throw new SchemaValidationError(
        `${location} DAYS must be an array of Python day names`
      );
  } else if (action === RuleActions.SCHEDULE_BETWEEN_TIME_RANGE) {
    for (const bound of [value.START, value.END]) {
      if (
        !isString(bound) ||
        bound.length !== 5 ||
        !/^(?:2[0-3]|[01]\d):[0-5]\d$/.test(bound)
      )
        throw new SchemaValidationError(
          `${location} START and END must use HH:MM`
        );
    }
  } else {
    for (const bound of [value.START, value.END]) {
      if (parseNaiveDatetime(bound) === null)
        throw new SchemaValidationError(
          `${location} START and END must use timezone-naive ISO8601`
        );
    }
  }
  validateTimezone(value.TIMEZONE, location);
};

export { validateScheduleAndModulo };

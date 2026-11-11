import type { JSONValue } from '@aws-lambda-powertools/commons/types';
import { RuleActions, TimeActionKeys } from '../constants.js';
import type {
  DatetimeRange,
  TimeAction,
  TimeRange,
} from '../types/RuleEngine.js';
import { parseNaiveDatetime } from './datetime.js';
import { isDatetimeRange, isDaysOfWeek, isTimeRange } from './guards.js';

/**
 * Identifies Actions that ignore caller context and read the clock.
 * @param action - Supply the validated Action
 * @internal
 */
const isTimeAction = (action: string): action is TimeAction =>
  Object.hasOwn(TimeActionKeys, action);

/** Supplies the default clock without reading host-local calendar fields. @internal */
const currentDate = (): Date => new Date();

/**
 * Reads wall-clock fields from an instant in the document's timezone, defaulting to UTC.
 * @param now - Supply the clock instant
 * @param timeZone - Supply the validated IANA zone
 * @internal
 */
const wallClock = (now: Date, timeZone = 'UTC'): Record<string, string> => {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone,
    calendar: 'gregory',
    numberingSystem: 'latn',
    hourCycle: 'h23',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    fractionalSecondDigits: 3,
    weekday: 'long',
  });
  const fields: Record<string, string> = {};
  for (const { type, value } of formatter.formatToParts(now))
    fields[type] = value;
  return fields;
};

/**
 * Converts HH:MM to full minutes since midnight.
 * @param value - Supply a validated time bound
 * @internal
 */
const minutesSinceMidnight = (value: string): number =>
  Number(value.slice(0, 2)) * 60 + Number(value.slice(3));

/**
 * Matches inclusive time bounds, including ranges crossing midnight within one hour.
 * Python replaces only hours/minutes on now, retaining its seconds/microseconds.
 * Comparing minutes therefore includes the entire START and END minutes.
 * @param value - Supply validated schedule bounds
 * @param now - Supply the clock instant
 * @internal
 */
const compareTimeRange = (value: TimeRange, now: Date): boolean => {
  const fields = wallClock(now, value.TIMEZONE);
  const current = Number(fields.hour) * 60 + Number(fields.minute);
  const start = minutesSinceMidnight(value.START);
  const end = minutesSinceMidnight(value.END);
  return end < start
    ? start <= current || current <= end
    : start <= current && current <= end;
};

/**
 * Matches inclusive naive datetime bounds against zoned wall-clock fields.
 * Python attaches the same dateutil tzinfo to START, END, and now. Its datetime
 * comparisons then ignore offsets and fold, comparing wall-clock fields. This
 * deliberately matches both occurrences of a fall-back time and leaves spring
 * gaps unnormalized. Reversed intervals validate but never match.
 * @param value - Supply validated naive datetime bounds and timezone
 * @param now - Supply the clock instant
 * @internal
 */
const compareDatetimeRange = (value: DatetimeRange, now: Date): boolean => {
  const fields = wallClock(now, value.TIMEZONE);
  const current = `${fields.year.padStart(4, '0')}-${fields.month}-${fields.day}T${fields.hour}:${fields.minute}:${fields.second}.${fields.fractionalSecond.padEnd(6, '0')}`;
  // Validation guarantees both bounds parse to canonical wall-clock strings.
  const start = parseNaiveDatetime(value.START) as string;
  const end = parseNaiveDatetime(value.END) as string;
  return start <= current && current <= end;
};

/** Dispatches schedule Actions after validation, without using context values. @internal */
const timeActions: Record<
  TimeAction,
  (value: JSONValue, now: Date) => boolean
> = {
  [RuleActions.SCHEDULE_BETWEEN_TIME_RANGE]: (value, now) => {
    if (!isTimeRange(value)) throw new TypeError('Incompatible operands');
    return compareTimeRange(value, now);
  },
  [RuleActions.SCHEDULE_BETWEEN_DATETIME_RANGE]: (value, now) => {
    if (!isDatetimeRange(value)) throw new TypeError('Incompatible operands');
    return compareDatetimeRange(value, now);
  },
  [RuleActions.SCHEDULE_BETWEEN_DAYS_OF_WEEK]: (value, now) => {
    if (!isDaysOfWeek(value)) throw new TypeError('Incompatible operands');
    return value.DAYS.includes(
      wallClock(now, value.TIMEZONE).weekday.toUpperCase()
    );
  },
};

export { currentDate, isTimeAction, timeActions };

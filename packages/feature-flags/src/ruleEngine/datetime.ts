/**
 * Checks Gregorian calendar fields without depending on the host timezone.
 * @param year - Supply the year
 * @param month - Supply the month
 * @param day - Supply the day
 * @internal
 */
const isCalendarDate = (year: number, month: number, day: number): boolean => {
  const leapYear = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
  const monthLengths = [
    31,
    leapYear ? 29 : 28,
    31,
    30,
    31,
    30,
    31,
    31,
    30,
    31,
    30,
    31,
  ];
  return (
    year >= 1 &&
    year <= 9999 &&
    month >= 1 &&
    month <= 12 &&
    day >= 1 &&
    day <= monthLengths[month - 1]
  );
};

/**
 * Converts a Python-compatible ISO week date to a calendar date using UTC only.
 * @param year - Supply the ISO week year
 * @param week - Supply the ISO week number
 * @param day - Supply the ISO weekday, Monday being one
 * @internal
 */
const weekDate = (year: number, week: number, day: number): string | null => {
  const date = new Date(0);
  date.setUTCFullYear(year, 0, 1);
  const januaryFirst = date.getUTCDay();
  const leapYear = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
  const weeks =
    januaryFirst === 4 || (januaryFirst === 3 && leapYear) ? 53 : 52;
  if (year < 1 || week < 1 || week > weeks) return null;
  date.setUTCDate(4);
  const mondayOffset = (date.getUTCDay() + 6) % 7;
  date.setUTCDate(4 - mondayOffset + (week - 1) * 7 + day - 1);
  if (date.getUTCFullYear() > 9999) return null;
  return date.toISOString().slice(0, 10);
};

/**
 * Finds Python's date/time separator, including ambiguous basic ISO week dates.
 * @param value - Supply the datetime string
 * @internal
 */
const datePrefixLength = (value: string): number => {
  if (value[4] === '-') {
    if (value[5] !== 'W') return 10;
    // Python prefers '-' as a separator in YYYY-Www-## over a numeric separator.
    return value[8] === '-' && !/^\d$/.test(value[10] ?? '') ? 10 : 8;
  }
  if (value[4] !== 'W') return 8;
  let index = 7;
  while (/^\d$/.test(value[index] ?? '')) index++;
  if (index < 9) return index;
  return index % 2 === 0 ? 7 : 8;
};

/**
 * Parses timezone-naive datetime.fromisoformat formats into sortable wall-clock fields.
 * Accepts calendar and ISO week dates, basic and extended times, date-only bounds,
 * one-character separators, and dot/comma fractions. Like Python, fractions denote
 * seconds even after hours or minutes and truncate to six digits. Never parses a
 * bound through the host timezone or resolves a DST gap/overlap to an instant.
 * @param value - Supply the document bound
 * @internal
 */
const parseNaiveDatetime = (value: unknown): string | null => {
  if (typeof value !== 'string') return null;
  const dateLength = datePrefixLength(value);
  const datePrefix = value.slice(0, dateLength);
  const calendar = /^(\d{4})(-?)(\d{2})\2(\d{2})$/.exec(datePrefix);
  const week = /^(\d{4})(-?)W(\d{2})(?:\2([1-7]))?$/.exec(datePrefix);
  let date: string;
  if (calendar) {
    const year = Number(calendar[1]);
    const month = Number(calendar[3]);
    const day = Number(calendar[4]);
    if (!isCalendarDate(year, month, day)) return null;
    date = `${calendar[1]}-${calendar[3]}-${calendar[4]}`;
  } else if (week) {
    const parsed = weekDate(
      Number(week[1]),
      Number(week[3]),
      Number(week[4] ?? 1)
    );
    if (parsed === null) return null;
    date = parsed;
  } else {
    return null;
  }
  if (value.length === dateLength) return `${date}T00:00:00.000000`;
  // Python permits any single Unicode character between date and time.
  // A parsed date prefix with remaining input guarantees a separator code point.
  const separator = String.fromCodePoint(
    value.codePointAt(dateLength) as number
  );
  // Python's validator replaces Z with +00:00 before parsing, so Z is never a naive separator.
  if (separator === 'Z') return null;
  const time = value.slice(dateLength + separator.length);
  // Python also accepts a basic HHMMSS time followed by two or more fraction digits.
  const match =
    /^(\d{2})(?:(:?)(\d{2})(?:\2(\d{2}))?)?(?:[.,](\d+))?$/.exec(time) ??
    /^(\d{2})()(\d{2})(\d{2})(\d{2,})$/.exec(time);
  // JavaScript's $ also matches before a trailing newline; Python consumes all input.
  if (!match || match[0] !== time) return null;
  const hour = match[1];
  const minute = match[3] ?? '00';
  const second = match[4] ?? '00';
  if (Number(hour) > 23 || Number(minute) > 59 || Number(second) > 59)
    return null;
  const fraction = (match[5] ?? '').slice(0, 6).padEnd(6, '0');
  return `${date}T${hour}:${minute}:${second}.${fraction}`;
};

export { parseNaiveDatetime };

// Ported from Powertools for Python v3.36.0:
// tests/functional/feature_flags/_boto3/test_time_based_actions.py.
import type { JSONValue } from '@aws-lambda-powertools/commons/types';

/** Builds a boolean flag with schedule or modulo Conditions for observable store tests. */
const conditionDocument = (
  conditions: { action: string; key: string; value: JSONValue }[]
) => ({
  my_feature: {
    default: false,
    rules: { scheduled: { when_match: true, conditions } },
  },
});

/** Reconstructs all single-condition time-range cases from the Python functional suite. */
const timeRangeFixtures = [
  {
    start: '11:11',
    end: '23:59',
    instant: '2022-02-15T11:12:00Z',
    expected: true,
  },
  {
    start: '11:11',
    end: '23:59',
    instant: '2022-02-15T07:12:00Z',
    expected: false,
  },
  {
    start: '20:00',
    end: '23:00',
    instant: '2022-02-15T21:12:00Z',
    expected: true,
  },
  {
    start: '23:00',
    end: '04:00',
    instant: '2022-02-15T02:03:00Z',
    expected: true,
  },
  {
    start: '23:00',
    end: '04:00',
    instant: '2022-02-15T05:00:00Z',
    expected: false,
  },
  {
    start: '23:30',
    end: '23:00',
    instant: '2022-02-15T10:00:00Z',
    expected: true,
  },
  {
    start: '23:30',
    end: '23:00',
    instant: '2022-02-15T23:15:00Z',
    expected: false,
  },
  {
    start: '11:11',
    end: '23:59',
    instant: '2022-02-15T10:11:00Z',
    timezone: 'Europe/Copenhagen',
    expected: true,
  },
  {
    start: '11:11',
    end: '23:59',
    instant: '2022-02-15T09:11:00Z',
    timezone: 'Europe/Copenhagen',
    expected: false,
  },
];

/** Reconstructs all datetime-range cases from the Python functional suite. */
const datetimeFixtures = [
  { instant: '2022-10-07T10:00:00Z', expected: true },
  {
    instant: '2022-09-07T08:00:00Z',
    timezone: 'Europe/Copenhagen',
    expected: false,
  },
  {
    instant: '2022-10-10T16:15:00Z',
    timezone: 'Europe/Copenhagen',
    expected: false,
  },
];

/** Reconstructs all day-of-week cases from the Python functional suite. */
const dayFixtures = [
  {
    days: ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'],
    instant: '2022-11-18T10:00:00Z',
    expected: true,
  },
  {
    days: ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'],
    instant: '2022-11-20T10:00:00Z',
    expected: false,
  },
  {
    days: ['SATURDAY', 'SUNDAY'],
    instant: '2022-11-19T10:00:00Z',
    expected: true,
  },
  {
    days: ['SATURDAY', 'SUNDAY'],
    instant: '2022-11-19T09:00:00Z',
    timezone: 'Europe/Copenhagen',
    expected: true,
  },
  {
    days: ['SATURDAY', 'SUNDAY'],
    instant: '2022-11-20T23:00:00Z',
    timezone: 'Europe/Copenhagen',
    expected: false,
  },
  {
    days: ['SATURDAY', 'SUNDAY'],
    instant: '2022-11-18T10:00:00Z',
    expected: false,
  },
];

export { conditionDocument, datetimeFixtures, dayFixtures, timeRangeFixtures };

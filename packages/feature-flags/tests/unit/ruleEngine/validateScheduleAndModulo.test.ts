// Ported from Powertools for Python v3.36.0:
// tests/functional/feature_flags/_boto3/test_schema_validation.py.
import type { JSONValue } from '@aws-lambda-powertools/commons/types';
import { describe, expect, it, vi } from 'vitest';
import { ruleEngineStore, SchemaValidationError } from '../../../src/index.js';
import { validate } from '../../../src/ruleEngine/validate.js';
import { conditionDocument } from './scheduleFixtures.js';

/** Exercises each invalid bound in both START and END positions. */
const invalidBoundPairs = (
  bounds: string[],
  start: string,
  end: string
): JSONValue[] => {
  const pairs: JSONValue[] = [];
  for (const bound of bounds)
    pairs.push({ START: bound, END: end }, { START: start, END: bound });
  return pairs;
};

describe('Schedule and modulo validation', () => {
  it.each([
    {
      action: 'SCHEDULE_BETWEEN_TIME_RANGE',
      key: 'CURRENT_DATETIME',
      expectedKey: 'CURRENT_TIME',
      value: { START: '11:11', END: '23:59' },
    },
    {
      action: 'SCHEDULE_BETWEEN_DATETIME_RANGE',
      key: 'CURRENT_TIME',
      expectedKey: 'CURRENT_DATETIME',
      value: { START: '2022-10-05T12:15:00', END: '2022-10-10T12:15:00' },
    },
    {
      action: 'SCHEDULE_BETWEEN_DAYS_OF_WEEK',
      key: 'CURRENT_TIME',
      expectedKey: 'CURRENT_DAY_OF_WEEK',
      value: { DAYS: ['SUNDAY'] },
    },
  ])(
    'requires $expectedKey for $action',
    ({ action, key, expectedKey, value }) => {
      // Prepare
      const document = conditionDocument([{ action, key, value }]);
      // Act
      const act = () => validate(document);
      // Assess
      expect(act).toThrow(SchemaValidationError);
      expect(act).toThrow(`key must be ${expectedKey}`);
    }
  );

  it.each([
    'SCHEDULE_BETWEEN_TIME_RANGE',
    'SCHEDULE_BETWEEN_DATETIME_RANGE',
    'SCHEDULE_BETWEEN_DAYS_OF_WEEK',
    'MODULO_RANGE',
  ])('requires an object value for %s', (action) => {
    // Prepare
    const keys: Record<string, string> = {
      SCHEDULE_BETWEEN_TIME_RANGE: 'CURRENT_TIME',
      SCHEDULE_BETWEEN_DATETIME_RANGE: 'CURRENT_DATETIME',
      SCHEDULE_BETWEEN_DAYS_OF_WEEK: 'CURRENT_DAY_OF_WEEK',
      MODULO_RANGE: 'tenant_id',
    };
    const document = conditionDocument([
      { action, key: keys[action], value: 'secret-operand' },
    ]);
    // Act
    const act = () => validate(document);
    // Assess
    expect(act).toThrow(SchemaValidationError);
    expect(act).toThrow('value must be an object');
    expect(act).not.toThrow('secret-operand');
  });

  it.each<JSONValue>([
    {},
    { START: '23:59' },
    { END: '23:59' },
    { START: 4, END: '23:59' },
    { START: '11:11', END: 4 },
    ...invalidBoundPairs(
      [
        '11-11',
        '24:99',
        '10:00abc',
        'abc10:00',
        '110:00',
        '10:00\n',
        '1:00',
        '01:60',
        '',
      ],
      '10:11',
      '23:59'
    ),
    { START: '10:11', END: '999:59' },
    { START: '10:11', END: '12:000' },
  ])('rejects malformed HH:MM bounds %j', (value) => {
    // Prepare
    const document = conditionDocument([
      { action: 'SCHEDULE_BETWEEN_TIME_RANGE', key: 'CURRENT_TIME', value },
    ]);
    // Act
    const act = () => validate(document);
    // Assess
    expect(act).toThrow(SchemaValidationError);
    expect(act).toThrow('START and END must use HH:MM');
  });

  it.each<JSONValue>([
    {},
    { START: '2022-10-05T12:15:00' },
    { END: '2022-10-10T12:15:00' },
    { START: 4, END: '2022-10-10T12:15:00' },
    { START: '2022-10-05T12:15:00', END: 4 },
    ...invalidBoundPairs(
      [
        '11:11',
        '24:99',
        '2022-10-10T',
        '2022-10-10T12:15:00Z',
        '2022-10-10T12:15:00+02:00',
        '2022-10-10T12:15:00-0500',
      ],
      '2022-10-05T12:15:00',
      '2022-10-10T12:15:00'
    ),
  ])('rejects malformed or offset-bearing datetime bounds %j', (value) => {
    // Prepare
    const document = conditionDocument([
      {
        action: 'SCHEDULE_BETWEEN_DATETIME_RANGE',
        key: 'CURRENT_DATETIME',
        value,
      },
    ]);
    // Act
    const act = () => validate(document);
    // Assess
    expect(act).toThrow(SchemaValidationError);
    expect(act).toThrow('START and END must use timezone-naive ISO8601');
  });

  it.each<JSONValue>([
    {},
    { DAYS: 'SUNDAY' },
    { DAYS: ['SUNDAY', 'funday'] },
    { DAYS: ['SUNDAY', 1] },
    { DAYS: ['sunday'] },
  ])('rejects missing or invalid Python day lists %j', (value) => {
    // Prepare
    const document = conditionDocument([
      {
        action: 'SCHEDULE_BETWEEN_DAYS_OF_WEEK',
        key: 'CURRENT_DAY_OF_WEEK',
        value,
      },
    ]);
    // Act
    const act = () => validate(document);
    // Assess
    expect(act).toThrow(SchemaValidationError);
    expect(act).toThrow('DAYS must be an array of Python day names');
  });

  it.each<JSONValue>([
    'Europe/Tokyo',
    '',
    '+01:00',
    '-05:00',
    42,
    true,
    null,
    [],
  ])(
    'rejects invalid IANA timezone %j before reading the clock',
    async (timezone) => {
      // Prepare
      const now = vi.fn(() => new Date('2026-06-01T18:00:00Z'));
      const store = ruleEngineStore({
        source: async () =>
          conditionDocument([
            {
              action: 'SCHEDULE_BETWEEN_TIME_RANGE',
              key: 'CURRENT_TIME',
              value: { START: '00:00', END: '23:59', TIMEZONE: timezone },
            },
          ]),
        now,
      });
      // Act
      const result = store.getAll({});
      // Assess
      await expect(result).rejects.toBeInstanceOf(SchemaValidationError);
      await expect(result).rejects.toThrow('TIMEZONE must be');
      expect(now).not.toHaveBeenCalled();
    }
  );

  it.each(['Europe/Copenhagen', 'America/New_York', 'UTC', 'Asia/Kathmandu'])(
    'accepts IANA timezone %s for all three schedules',
    (timezone) => {
      // Prepare
      const document = conditionDocument([
        {
          action: 'SCHEDULE_BETWEEN_TIME_RANGE',
          key: 'CURRENT_TIME',
          value: { START: '10:11', END: '10:59', TIMEZONE: timezone },
        },
        {
          action: 'SCHEDULE_BETWEEN_DATETIME_RANGE',
          key: 'CURRENT_DATETIME',
          value: { START: '2026-06-01', END: '2026-06-02', TIMEZONE: timezone },
        },
        {
          action: 'SCHEDULE_BETWEEN_DAYS_OF_WEEK',
          key: 'CURRENT_DAY_OF_WEEK',
          value: { DAYS: ['SUNDAY'], TIMEZONE: timezone },
        },
      ]);
      // Act
      const result = validate(document);
      // Assess
      expect(result.my_feature.rules.scheduled.conditions).toEqual(
        document.my_feature.rules.scheduled.conditions
      );
    }
  );

  it.each<JSONValue>([
    {},
    { BASE: 100, START: 0 },
    { BASE: 100, END: 29 },
    { START: 0, END: 29 },
    { BASE: null, START: 0, END: 29 },
    { BASE: '100', START: '0', END: '49' },
    { BASE: 10.5, START: 0, END: 9 },
    { BASE: 10, START: 0.5, END: 9 },
    { BASE: 10, START: 0, END: 9.5 },
    { BASE: true, START: 0, END: 0 },
    { BASE: 10, START: false, END: 9 },
    { BASE: 10, START: 0, END: true },
  ])('rejects missing or non-integer modulo fields %j', (value) => {
    // Prepare
    const document = conditionDocument([
      { action: 'MODULO_RANGE', key: 'tenant_id', value },
    ]);
    // Act
    const act = () => validate(document);
    // Assess
    expect(act).toThrow(SchemaValidationError);
    expect(act).toThrow('BASE, START, and END must be integers');
  });

  it.each([
    { BASE: 100, START: 50, END: 49 },
    { BASE: 100, START: -10, END: 49 },
    { BASE: 100, START: 0, END: 100 },
    { BASE: 0, START: 0, END: 0 },
    { BASE: -10, START: 0, END: 0 },
    { BASE: 10, START: 0, END: -1 },
    { BASE: 1e20, START: 0, END: 1e20 },
  ])('rejects violated modulo bounds %j', (value) => {
    // Prepare
    const document = conditionDocument([
      { action: 'MODULO_RANGE', key: 'tenant_id', value },
    ]);
    // Act
    const act = () => validate(document);
    // Assess
    expect(act).toThrow(SchemaValidationError);
    expect(act).toThrow('must satisfy 0 <= START <= END <= BASE - 1');
  });

  it.each([
    { BASE: 100, START: 0, END: 19 },
    { BASE: 100, START: 0, END: 99 },
    { BASE: 1, START: 0, END: 0 },
    { BASE: 100, START: 99, END: 99 },
  ])('accepts inclusive integer modulo bounds %j', (value) => {
    // Prepare
    const document = conditionDocument([
      { action: 'MODULO_RANGE', key: 'tenant_id', value },
    ]);
    // Act
    const result = validate(document);
    // Assess
    expect(result.my_feature.rules.scheduled.conditions[0].value).toEqual(
      value
    );
  });
});

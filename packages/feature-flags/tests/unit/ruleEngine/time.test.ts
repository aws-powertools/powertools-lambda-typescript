// Ported from Powertools for Python v3.36.0's test_time_based_actions.py.
// Additional boundary, context, clock, and DST cases exercise RFC #5614 / issue #5903.
import type { JSONValue } from '@aws-lambda-powertools/commons/types';
import { describe, expect, it, vi } from 'vitest';
import { FeatureFlags, ruleEngineStore } from '../../../src/index.js';
import {
  conditionDocument,
  datetimeFixtures,
  dayFixtures,
  timeRangeFixtures,
} from './scheduleFixtures.js';

describe('Schedule Actions', () => {
  it('keeps batch time-range flags on the same side of a clock boundary', async () => {
    // Prepare
    const now = vi
      .fn<() => Date>()
      .mockReturnValueOnce(new Date('2026-06-01T18:59:59.999Z'))
      .mockReturnValue(new Date('2026-06-01T19:00:00.000Z'));
    const document = conditionDocument([
      {
        action: 'SCHEDULE_BETWEEN_TIME_RANGE',
        key: 'CURRENT_TIME',
        value: { START: '18:59', END: '18:59' },
      },
    ]);
    const store = ruleEngineStore({
      source: async () => ({
        first: document.my_feature,
        second: document.my_feature,
      }),
      now,
    });
    // Act
    const result = await store.getMany(['first', 'second'], {});
    // Assess
    expect(result).toEqual({
      first: { found: true, value: true, enabled: true },
      second: { found: true, value: true, enabled: true },
    });
    expect(now).toHaveBeenCalledExactlyOnceWith();
  });

  it('reads the clock exactly once per getMany and getAll across flags and schedule Conditions', async () => {
    // Prepare
    const now = vi
      .fn<() => Date>()
      .mockReturnValue(new Date('2026-06-01T18:00:00Z'));
    const document = conditionDocument([
      {
        action: 'SCHEDULE_BETWEEN_TIME_RANGE',
        key: 'CURRENT_TIME',
        value: { START: '17:00', END: '19:00' },
      },
      {
        action: 'SCHEDULE_BETWEEN_DATETIME_RANGE',
        key: 'CURRENT_DATETIME',
        value: { START: '2026-06-01T17:00:00', END: '2026-06-01T19:00:00' },
      },
      {
        action: 'SCHEDULE_BETWEEN_DAYS_OF_WEEK',
        key: 'CURRENT_DAY_OF_WEEK',
        value: { DAYS: ['MONDAY'] },
      },
    ]);
    const store = ruleEngineStore({
      source: async () => ({
        first: document.my_feature,
        second: document.my_feature,
      }),
      now,
    });
    // Act
    const selected = await store.getMany(['first', 'second'], {});
    // Assess
    expect(now).toHaveBeenCalledExactlyOnceWith();
    expect(selected).toEqual({
      first: { found: true, value: true, enabled: true },
      second: { found: true, value: true, enabled: true },
    });
    // Act
    const all = await store.getAll({});
    // Assess
    expect(now).toHaveBeenCalledTimes(2);
    expect(all).toEqual(selected);
  });

  it('reads one clock instant even without schedule Conditions or selected flags', async () => {
    // Prepare
    const now = vi
      .fn<() => Date>()
      .mockReturnValue(new Date('2026-06-01T18:00:00Z'));
    const store = ruleEngineStore({
      source: async () => ({ always: { default: true } }),
      now,
    });
    // Act
    const selected = await store.getMany([], {});
    // Assess
    expect(now).toHaveBeenCalledExactlyOnceWith();
    expect(selected).toEqual({});
    // Act
    const all = await store.getAll({});
    // Assess
    expect(now).toHaveBeenCalledTimes(2);
    expect(all).toEqual({
      always: { found: true, value: true, enabled: true },
    });
  });

  it('keeps disjoint datetime conditions from matching across a clock boundary', async () => {
    // Prepare
    const now = vi
      .fn<() => Date>()
      .mockReturnValueOnce(new Date('2026-06-01T18:59:59.999Z'))
      .mockReturnValue(new Date('2026-06-01T19:00:00.000Z'));

    const flags = new FeatureFlags({
      store: ruleEngineStore({
        source: async () =>
          conditionDocument([
            {
              action: 'SCHEDULE_BETWEEN_DATETIME_RANGE',
              key: 'CURRENT_DATETIME',
              value: {
                START: '2026-06-01T18:59:59',
                END: '2026-06-01T18:59:59.999',
              },
            },
            {
              action: 'SCHEDULE_BETWEEN_DATETIME_RANGE',
              key: 'CURRENT_DATETIME',
              value: {
                START: '2026-06-01T19:00:00',
                END: '2026-06-01T19:00:01',
              },
            },
          ]),
        now,
      }),
    });

    // Act
    const result = await flags.evaluate({
      name: 'my_feature',
      default: false,
    });

    // Assess
    expect(result).toBe(false);
  });

  it.each([
    { day: 'SUNDAY', instant: '2026-06-07T12:00:00Z' },
    { day: 'MONDAY', instant: '2026-06-08T12:00:00Z' },
    { day: 'TUESDAY', instant: '2026-06-09T12:00:00Z' },
    { day: 'WEDNESDAY', instant: '2026-06-10T12:00:00Z' },
    { day: 'THURSDAY', instant: '2026-06-11T12:00:00Z' },
    { day: 'FRIDAY', instant: '2026-06-12T12:00:00Z' },
    { day: 'SATURDAY', instant: '2026-06-13T12:00:00Z' },
  ])('matches Python day name $day at $instant', async ({ day, instant }) => {
    // Prepare
    const store = ruleEngineStore({
      source: async () =>
        conditionDocument([
          {
            action: 'SCHEDULE_BETWEEN_DAYS_OF_WEEK',
            key: 'CURRENT_DAY_OF_WEEK',
            value: { DAYS: [day] },
          },
        ]),
      now: () => new Date(instant),
    });
    // Act
    const result = await store.getAll({});
    // Assess
    expect(result.my_feature).toEqual({
      found: true,
      value: true,
      enabled: true,
    });
  });

  it('reads the minute offset in a fractional-hour IANA timezone', async () => {
    // Prepare
    const store = ruleEngineStore({
      source: async () =>
        conditionDocument([
          {
            action: 'SCHEDULE_BETWEEN_TIME_RANGE',
            key: 'CURRENT_TIME',
            value: { START: '17:00', END: '17:00', TIMEZONE: 'Asia/Kathmandu' },
          },
        ]),
      now: () => new Date('2026-06-01T11:15:00Z'),
    });
    // Act
    const result = await store.getAll({});
    // Assess
    expect(result.my_feature).toEqual({
      found: true,
      value: true,
      enabled: true,
    });
  });

  it.each(timeRangeFixtures)(
    'ports the Python time range $start to $end at $instant',
    async ({ start, end, instant, timezone, expected }) => {
      // Prepare
      const value: Record<string, JSONValue> = { START: start, END: end };
      if (timezone !== undefined) value.TIMEZONE = timezone;
      const store = ruleEngineStore({
        source: async () =>
          conditionDocument([
            {
              action: 'SCHEDULE_BETWEEN_TIME_RANGE',
              key: 'CURRENT_TIME',
              value,
            },
          ]),
        now: () => new Date(instant),
      });
      // Act
      const result = await store.getAll({});
      // Assess
      expect(result.my_feature).toEqual({
        found: true,
        value: expected,
        enabled: expected,
      });
    }
  );

  it.each(datetimeFixtures)(
    'ports the Python datetime range at $instant',
    async ({ instant, timezone, expected }) => {
      // Prepare
      const value: Record<string, JSONValue> = {
        START: '2022-10-05T12:15:00',
        END: '2022-10-10T12:15:00',
      };
      if (timezone !== undefined) value.TIMEZONE = timezone;
      const store = ruleEngineStore({
        source: async () =>
          conditionDocument([
            {
              action: 'SCHEDULE_BETWEEN_DATETIME_RANGE',
              key: 'CURRENT_DATETIME',
              value,
            },
          ]),
        now: () => new Date(instant),
      });
      // Act
      const result = await store.getAll({});
      // Assess
      expect(result.my_feature).toEqual({
        found: true,
        value: expected,
        enabled: expected,
      });
    }
  );

  it.each(dayFixtures)(
    'ports the Python day list $days at $instant',
    async ({ days, instant, timezone, expected }) => {
      // Prepare
      const value: Record<string, JSONValue> = { DAYS: days };
      if (timezone !== undefined) value.TIMEZONE = timezone;
      const store = ruleEngineStore({
        source: async () =>
          conditionDocument([
            {
              action: 'SCHEDULE_BETWEEN_DAYS_OF_WEEK',
              key: 'CURRENT_DAY_OF_WEEK',
              value,
            },
          ]),
        now: () => new Date(instant),
      });
      // Act
      const result = await store.getAll({});
      // Assess
      expect(result.my_feature).toEqual({
        found: true,
        value: expected,
        enabled: expected,
      });
    }
  );

  it.each([
    { instant: '2022-10-07T10:00:00Z', username: 'ran', expected: true },
    { instant: '2022-10-07T07:00:00Z', username: 'ran', expected: false },
    { instant: '2022-10-07T10:00:00Z', username: 'other', expected: false },
  ])(
    'ANDs Python schedule and context Conditions at $instant for $username',
    async ({ instant, username, expected }) => {
      // Prepare
      const store = ruleEngineStore({
        source: async () =>
          conditionDocument([
            {
              action: 'SCHEDULE_BETWEEN_TIME_RANGE',
              key: 'CURRENT_TIME',
              value: { START: '09:00', END: '17:00' },
            },
            { action: 'EQUALS', key: 'username', value: 'ran' },
          ]),
        now: () => new Date(instant),
      });
      // Act
      const result = await store.getAll({ username });
      // Assess
      expect(result.my_feature).toEqual({
        found: true,
        value: expected,
        enabled: expected,
      });
    }
  );

  it.each([
    { instant: '2022-11-17T16:00:00Z', expected: true },
    { instant: '2022-11-17T09:00:00Z', expected: false },
    { instant: '2022-11-18T13:00:00Z', expected: false },
    { instant: '2022-11-18T09:00:00Z', expected: false },
  ])(
    'ANDs Python day and time Conditions at $instant',
    async ({ instant, expected }) => {
      // Prepare
      const store = ruleEngineStore({
        source: async () =>
          conditionDocument([
            {
              action: 'SCHEDULE_BETWEEN_TIME_RANGE',
              key: 'CURRENT_TIME',
              value: { START: '11:00', END: '23:00' },
            },
            {
              action: 'SCHEDULE_BETWEEN_DAYS_OF_WEEK',
              key: 'CURRENT_DAY_OF_WEEK',
              value: { DAYS: ['MONDAY', 'THURSDAY'] },
            },
          ]),
        now: () => new Date(instant),
      });
      // Act
      const result = await store.getAll({});
      // Assess
      expect(result.my_feature).toEqual({
        found: true,
        value: expected,
        enabled: expected,
      });
    }
  );

  it.each([
    {
      start: '17:00',
      end: '19:00',
      instant: '2026-06-01T16:59:59.999Z',
      expected: false,
    },
    {
      start: '17:00',
      end: '19:00',
      instant: '2026-06-01T17:00:00Z',
      expected: true,
    },
    {
      start: '17:00',
      end: '19:00',
      instant: '2026-06-01T19:00:00Z',
      expected: true,
    },
    {
      start: '17:00',
      end: '19:00',
      instant: '2026-06-01T19:00:59.999Z',
      expected: true,
    },
    {
      start: '17:00',
      end: '19:00',
      instant: '2026-06-01T19:01:00Z',
      expected: false,
    },
    {
      start: '23:30',
      end: '23:00',
      instant: '2026-06-01T23:30:00Z',
      expected: true,
    },
    {
      start: '23:30',
      end: '23:00',
      instant: '2026-06-01T23:00:00Z',
      expected: true,
    },
    {
      start: '23:30',
      end: '23:00',
      instant: '2026-06-01T23:45:00Z',
      expected: true,
    },
    {
      start: '23:30',
      end: '23:00',
      instant: '2026-06-01T00:00:00Z',
      expected: true,
    },
    {
      start: '23:30',
      end: '23:00',
      instant: '2026-06-01T23:29:59Z',
      expected: false,
    },
    {
      start: '17:00',
      end: '17:00',
      instant: '2026-06-01T17:00:59Z',
      expected: true,
    },
    {
      start: '17:00',
      end: '17:00',
      instant: '2026-06-01T17:01:00Z',
      expected: false,
    },
  ])(
    'includes time boundaries $start to $end at $instant',
    async ({ start, end, instant, expected }) => {
      // Prepare
      const store = ruleEngineStore({
        source: async () =>
          conditionDocument([
            {
              action: 'SCHEDULE_BETWEEN_TIME_RANGE',
              key: 'CURRENT_TIME',
              value: { START: start, END: end },
            },
          ]),
        now: () => new Date(instant),
      });
      // Act
      const result = await store.getMany(['my_feature'], {});
      // Assess
      expect(result.my_feature).toEqual({
        found: true,
        value: expected,
        enabled: expected,
      });
    }
  );

  it.each([
    { instant: '2026-06-01T16:59:59.999Z', expected: false },
    { instant: '2026-06-01T17:00:00Z', expected: true },
    { instant: '2026-06-01T19:00:00Z', expected: true },
    { instant: '2026-06-01T19:00:00.001Z', expected: false },
  ])(
    'includes exact datetime boundaries at $instant',
    async ({ instant, expected }) => {
      // Prepare
      const store = ruleEngineStore({
        source: async () =>
          conditionDocument([
            {
              action: 'SCHEDULE_BETWEEN_DATETIME_RANGE',
              key: 'CURRENT_DATETIME',
              value: {
                START: '2026-06-01T17:00:00',
                END: '2026-06-01T19:00:00',
              },
            },
          ]),
        now: () => new Date(instant),
      });
      // Act
      const result = await store.getAll({});
      // Assess
      expect(result.my_feature).toEqual({
        found: true,
        value: expected,
        enabled: expected,
      });
    }
  );

  it.each([
    { instant: '2026-06-06T03:59:59.999Z', expected: false },
    { instant: '2026-06-06T04:00:00Z', expected: true },
    { instant: '2026-06-08T03:59:59.999Z', expected: true },
    { instant: '2026-06-08T04:00:00Z', expected: false },
  ])(
    'includes the entire first and last selected days at $instant',
    async ({ instant, expected }) => {
      // Prepare
      const store = ruleEngineStore({
        source: async () =>
          conditionDocument([
            {
              action: 'SCHEDULE_BETWEEN_DAYS_OF_WEEK',
              key: 'CURRENT_DAY_OF_WEEK',
              value: {
                DAYS: ['SATURDAY', 'SUNDAY'],
                TIMEZONE: 'America/New_York',
              },
            },
          ]),
        now: () => new Date(instant),
      });
      // Act
      const result = await store.getAll({});
      // Assess
      expect(result.my_feature).toEqual({
        found: true,
        value: expected,
        enabled: expected,
      });
    }
  );

  it.each<{
    action: string;
    key: string;
    value: JSONValue;
    instant: string;
    expected: boolean;
  }>([
    {
      action: 'SCHEDULE_BETWEEN_TIME_RANGE',
      key: 'CURRENT_TIME',
      value: { START: '01:30', END: '02:30', TIMEZONE: 'America/New_York' },
      instant: '2026-03-08T06:30:00Z',
      expected: true,
    },
    {
      action: 'SCHEDULE_BETWEEN_TIME_RANGE',
      key: 'CURRENT_TIME',
      value: { START: '01:30', END: '02:30', TIMEZONE: 'America/New_York' },
      instant: '2026-03-08T07:00:00Z',
      expected: false,
    },
    {
      action: 'SCHEDULE_BETWEEN_DATETIME_RANGE',
      key: 'CURRENT_DATETIME',
      value: {
        START: '2026-03-08T02:15:00',
        END: '2026-03-08T03:15:00',
        TIMEZONE: 'America/New_York',
      },
      instant: '2026-03-08T06:30:00Z',
      expected: false,
    },
    {
      action: 'SCHEDULE_BETWEEN_DATETIME_RANGE',
      key: 'CURRENT_DATETIME',
      value: {
        START: '2026-03-08T02:15:00',
        END: '2026-03-08T03:15:00',
        TIMEZONE: 'America/New_York',
      },
      instant: '2026-03-08T07:00:00Z',
      expected: true,
    },
    {
      action: 'SCHEDULE_BETWEEN_DATETIME_RANGE',
      key: 'CURRENT_DATETIME',
      value: {
        START: '2026-03-08T02:15:00',
        END: '2026-03-08T02:45:00',
        TIMEZONE: 'America/New_York',
      },
      instant: '2026-03-08T07:30:00Z',
      expected: false,
    },
    {
      action: 'SCHEDULE_BETWEEN_DATETIME_RANGE',
      key: 'CURRENT_DATETIME',
      value: {
        START: '2026-03-08T02:15:00',
        END: '2026-03-08T02:45:00',
        TIMEZONE: 'America/New_York',
      },
      instant: '2026-03-08T06:30:00Z',
      expected: false,
    },
    {
      action: 'SCHEDULE_BETWEEN_DATETIME_RANGE',
      key: 'CURRENT_DATETIME',
      value: {
        START: '2026-11-01T01:15:00',
        END: '2026-11-01T01:45:00',
        TIMEZONE: 'America/New_York',
      },
      instant: '2026-11-01T05:30:00Z',
      expected: true,
    },
    {
      action: 'SCHEDULE_BETWEEN_DATETIME_RANGE',
      key: 'CURRENT_DATETIME',
      value: {
        START: '2026-11-01T01:15:00',
        END: '2026-11-01T01:45:00',
        TIMEZONE: 'America/New_York',
      },
      instant: '2026-11-01T06:30:00Z',
      expected: true,
    },
    {
      action: 'SCHEDULE_BETWEEN_DATETIME_RANGE',
      key: 'CURRENT_DATETIME',
      value: {
        START: '2026-11-01T01:45:00',
        END: '2026-11-01T02:00:00',
        TIMEZONE: 'America/New_York',
      },
      instant: '2026-11-01T06:30:00Z',
      expected: false,
    },
    {
      action: 'SCHEDULE_BETWEEN_TIME_RANGE',
      key: 'CURRENT_TIME',
      value: { START: '01:15', END: '01:45', TIMEZONE: 'America/New_York' },
      instant: '2026-11-01T05:30:00Z',
      expected: true,
    },
    {
      action: 'SCHEDULE_BETWEEN_TIME_RANGE',
      key: 'CURRENT_TIME',
      value: { START: '01:15', END: '01:45', TIMEZONE: 'America/New_York' },
      instant: '2026-11-01T06:30:00Z',
      expected: true,
    },
    {
      action: 'SCHEDULE_BETWEEN_DAYS_OF_WEEK',
      key: 'CURRENT_DAY_OF_WEEK',
      value: { DAYS: ['SUNDAY'], TIMEZONE: 'America/New_York' },
      instant: '2026-03-08T07:00:00Z',
      expected: true,
    },
    {
      action: 'SCHEDULE_BETWEEN_DAYS_OF_WEEK',
      key: 'CURRENT_DAY_OF_WEEK',
      value: { DAYS: ['SUNDAY'], TIMEZONE: 'America/New_York' },
      instant: '2026-11-01T06:00:00Z',
      expected: true,
    },
  ])(
    'matches Python DST wall-clock semantics for $action at $instant',
    async ({ action, key, value, instant, expected }) => {
      // Prepare
      const store = ruleEngineStore({
        source: async () => conditionDocument([{ action, key, value }]),
        now: () => new Date(instant),
      });
      // Act
      const result = await store.getAll({});
      // Assess
      expect(result.my_feature).toEqual({
        found: true,
        value: expected,
        enabled: expected,
      });
    }
  );

  it.each<{ action: string; key: string; value: JSONValue }>([
    {
      action: 'SCHEDULE_BETWEEN_TIME_RANGE',
      key: 'CURRENT_TIME',
      value: { START: '17:00', END: '19:00' },
    },
    {
      action: 'SCHEDULE_BETWEEN_DATETIME_RANGE',
      key: 'CURRENT_DATETIME',
      value: { START: '2026-06-01T17:00:00', END: '2026-06-01T19:00:00' },
    },
    {
      action: 'SCHEDULE_BETWEEN_DAYS_OF_WEEK',
      key: 'CURRENT_DAY_OF_WEEK',
      value: { DAYS: ['MONDAY'] },
    },
  ])(
    'ignores absent and conflicting caller context for $action',
    async ({ action, key, value }) => {
      // Prepare
      const store = ruleEngineStore({
        source: async () => conditionDocument([{ action, key, value }]),
        now: () => new Date('2026-06-01T18:00:00Z'),
      });
      // Act
      const missing = await store.getAll({});
      const conflicting = await store.getMany(['my_feature'], {
        [key]: 'never',
        CURRENT_TIME: '00:00',
      });
      // Assess
      expect(missing.my_feature).toEqual({
        found: true,
        value: true,
        enabled: true,
      });
      expect(conflicting).toEqual(missing);
    }
  );

  it.each(['2026-06-01T18:00:00Z', '2026-06-01T21:00:00Z'])(
    'accepts a reversed datetime interval without matching at %s',
    async (instant) => {
      // Prepare
      const store = ruleEngineStore({
        source: async () =>
          conditionDocument([
            {
              action: 'SCHEDULE_BETWEEN_DATETIME_RANGE',
              key: 'CURRENT_DATETIME',
              value: {
                START: '2026-06-01T19:00:00',
                END: '2026-06-01T17:00:00',
              },
            },
          ]),
        now: () => new Date(instant),
      });
      // Act
      const result = await store.getAll({});
      // Assess
      expect(result.my_feature).toEqual({
        found: true,
        value: false,
        enabled: false,
      });
    }
  );

  it.each([{ days: [] }, { days: ['DAYS'] }, { days: ['MONDAY', 'MONDAY'] }])(
    'preserves harmless Python day lists $days',
    async ({ days }) => {
      // Prepare
      const store = ruleEngineStore({
        source: async () =>
          conditionDocument([
            {
              action: 'SCHEDULE_BETWEEN_DAYS_OF_WEEK',
              key: 'CURRENT_DAY_OF_WEEK',
              value: { DAYS: days },
            },
          ]),
        now: () => new Date('2026-06-01T18:00:00Z'),
      });
      // Act
      const result = await store.getAll({});
      // Assess
      const expected = days.includes('MONDAY');
      expect(result.my_feature).toEqual({
        found: true,
        value: expected,
        enabled: expected,
      });
    }
  );

  it('reads a fresh injected clock instant per Store call and ignores document clock fields', async () => {
    // Prepare
    const now = vi
      .fn()
      .mockReturnValueOnce(new Date('2026-06-01T18:00:00Z'))
      .mockReturnValueOnce(new Date('2026-06-01T20:00:00Z'));
    const document = conditionDocument([
      {
        action: 'SCHEDULE_BETWEEN_TIME_RANGE',
        key: 'CURRENT_TIME',
        value: { START: '17:00', END: '19:00', now: '2026-06-01T18:00:00Z' },
      },
    ]);
    const store = ruleEngineStore({
      source: async () => ({
        ...document,
        my_feature: { ...document.my_feature, now: '2026-06-01T18:00:00Z' },
      }),
      now,
    });
    // Act
    const first = await store.getAll({});
    // Assess
    expect(now).toHaveBeenCalledExactlyOnceWith();
    // Act
    const second = await store.getMany(['my_feature'], {});
    // Assess
    expect(first.my_feature).toEqual({
      found: true,
      value: true,
      enabled: true,
    });
    expect(second.my_feature).toEqual({
      found: true,
      value: false,
      enabled: false,
    });
    expect(now).toHaveBeenCalledTimes(2);
  });

  it('uses the default Date clock without interpreting document clock fields', async () => {
    // Prepare
    const document = conditionDocument([
      {
        action: 'SCHEDULE_BETWEEN_TIME_RANGE',
        key: 'CURRENT_TIME',
        value: { START: '00:00', END: '23:59', now: 'not-a-clock' },
      },
    ]);
    const flags = new FeatureFlags({
      store: ruleEngineStore({ source: async () => document }),
    });
    // Act
    const result = await flags.evaluate({ name: 'my_feature', default: false });
    // Assess
    // Every UTC minute matches, independent of wall time and host TZ.
    expect(result).toBe(true);
  });
});

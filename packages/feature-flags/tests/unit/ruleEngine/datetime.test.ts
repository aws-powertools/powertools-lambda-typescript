// Conformance with datetime.fromisoformat used by Powertools for Python v3.36.0.
import { describe, expect, it } from 'vitest';
import { ruleEngineStore } from '../../../src/index.js';
import { parseNaiveDatetime } from '../../../src/ruleEngine/datetime.js';
import { conditionDocument } from './scheduleFixtures.js';

describe('Naive ISO datetime bounds', () => {
  it.each([
    { input: '2026-03-08', expected: '2026-03-08T00:00:00.000000' },
    { input: '20260308', expected: '2026-03-08T00:00:00.000000' },
    { input: '2026-W10', expected: '2026-03-02T00:00:00.000000' },
    { input: '2026W10', expected: '2026-03-02T00:00:00.000000' },
    { input: '2026-W10-7', expected: '2026-03-08T00:00:00.000000' },
    { input: '2026W107', expected: '2026-03-08T00:00:00.000000' },
    { input: '2026W10712', expected: '2026-03-02T12:00:00.000000' },
    { input: '2026W107121', expected: '2026-03-08T21:00:00.000000' },
    { input: '2026W10711010203', expected: '2026-03-02T11:01:02.030000' },
    { input: '2026-03-08T01020312', expected: '2026-03-08T01:02:03.120000' },
    { input: '2026-W10-12', expected: '2026-03-02T12:00:00.000000' },
    { input: '2026W107T12', expected: '2026-03-08T12:00:00.000000' },
    { input: '2026W10T12', expected: '2026-03-02T12:00:00.000000' },
    { input: '2026-03-08T12:15:30', expected: '2026-03-08T12:15:30.000000' },
    { input: '2026-03-08 12:15', expected: '2026-03-08T12:15:00.000000' },
    { input: '20260308T121530', expected: '2026-03-08T12:15:30.000000' },
    { input: '2026-03-08T12', expected: '2026-03-08T12:00:00.000000' },
    { input: '2026-03-08+12', expected: '2026-03-08T12:00:00.000000' },
    { input: '2026-03-08😀12:15:30', expected: '2026-03-08T12:15:30.000000' },
    {
      input: '2026-03-08T12:15:30.1234567',
      expected: '2026-03-08T12:15:30.123456',
    },
    { input: '2026-03-08T12:15:30,12', expected: '2026-03-08T12:15:30.120000' },
    { input: '2026-03-08T12.5', expected: '2026-03-08T12:00:00.500000' },
    { input: '2026-03-08T1215,5', expected: '2026-03-08T12:15:00.500000' },
    { input: '0001-01-01', expected: '0001-01-01T00:00:00.000000' },
    { input: '0001-W01-1', expected: '0001-01-01T00:00:00.000000' },
    { input: '0099-01-01', expected: '0099-01-01T00:00:00.000000' },
    { input: '2000-02-29', expected: '2000-02-29T00:00:00.000000' },
    { input: '2004-02-29', expected: '2004-02-29T00:00:00.000000' },
    { input: '2020-W53-7', expected: '2021-01-03T00:00:00.000000' },
    { input: '2015-W53-1', expected: '2015-12-28T00:00:00.000000' },
    { input: '9999-12-31', expected: '9999-12-31T00:00:00.000000' },
  ])('parses Python naive ISO format $input', ({ input, expected }) => {
    // Prepare
    const bound = input;
    // Act
    const result = parseNaiveDatetime(bound);
    // Assess
    expect(result).toBe(expected);
  });

  it.each([
    null,
    1,
    '',
    '2026',
    '2026-03',
    '2026-03-08T',
    '2026-03-08Z12',
    '0000-01-01',
    '0000-W01-1',
    '2026-00-01',
    '2026-13-01',
    '2026-03-00',
    '2026-04-31',
    '1900-02-29',
    '2026-02-29',
    '2026-W00-1',
    '2025-W53-1',
    '9999-W52-7',
    '2026-W10-0',
    '2026-W10-8',
    '2026-W10-',
    '2026-W10-712:00',
    '2026-03-08T24:00',
    '2026-03-08T12:60',
    '2026-03-08T12:15:60',
    '2026-03-08T12:15:30Z',
    '2026-03-08T12:15:30+01:00',
    '2026-03-08T12:15:30-01:00',
    '2026-03-08T12:15:30+00:00:01.5',
    '2026-03-08T12:15:30\n',
    '2026-03-08T1215:30',
    '2026-03-08T12:1530',
    '2026-03-08T12:15:30.',
    '2026-03-08T0102031',
    '202603-08',
    '2026-0308',
    '2026-001',
    '2026-W107',
  ])('rejects invalid or timezone-aware ISO bound %j', (input) => {
    // Prepare
    const bound = input;
    // Act
    const result = parseNaiveDatetime(bound);
    // Assess
    expect(result).toBeNull();
  });

  it.each([
    {
      start: '2026-03-08T12:15:30.123001',
      end: '2026-03-08T12:15:30.124',
      expected: false,
    },
    {
      start: '2026-03-08T12:15:30.122999',
      end: '2026-03-08T12:15:30.123001',
      expected: true,
    },
    {
      start: '2026-03-08T12:15:30.123',
      end: '2026-03-08T12:15:30.123',
      expected: true,
    },
    {
      start: '2026-03-08T12:15:30.122',
      end: '2026-03-08T12:15:30.122999',
      expected: false,
    },
    {
      start: '2026W107T121530,123',
      end: '2026-03-08T12:15:30.123',
      expected: true,
    },
  ])(
    'compares canonical wall-clock fields at microsecond bounds $start to $end',
    async ({ start, end, expected }) => {
      // Prepare
      const store = ruleEngineStore({
        source: async () =>
          conditionDocument([
            {
              action: 'SCHEDULE_BETWEEN_DATETIME_RANGE',
              key: 'CURRENT_DATETIME',
              value: { START: start, END: end },
            },
          ]),
        now: () => new Date('2026-03-08T12:15:30.123Z'),
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
});

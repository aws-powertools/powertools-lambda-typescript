import type { JSONValue } from '@aws-lambda-powertools/commons/types';
import { describe, expect, it } from 'vitest';
import { actions } from '../../../src/ruleEngine/actions.js';
import {
  isDatetimeRange,
  isDaysOfWeek,
  isModuloRange,
  isTimeRange,
} from '../../../src/ruleEngine/guards.js';
import { timeActions } from '../../../src/ruleEngine/time.js';
import type { TimeAction } from '../../../src/types/RuleEngine.js';

describe('Schedule and modulo guards', () => {
  it.each([
    {
      name: 'modulo',
      guard: isModuloRange,
      value: { BASE: 10, START: 0, END: 9 },
    },
    {
      name: 'time',
      guard: isTimeRange,
      value: { START: '23:30', END: '23:00', TIMEZONE: 'America/New_York' },
    },
    {
      name: 'datetime',
      guard: isDatetimeRange,
      value: {
        START: '2026-06-01T19:00:00',
        END: '2026-06-01T17:00:00',
        TIMEZONE: 'UTC',
      },
    },
    {
      name: 'days',
      guard: isDaysOfWeek,
      value: { DAYS: ['SUNDAY'], TIMEZONE: 'Europe/Rome' },
    },
  ])('narrows a complete valid $name shape', ({ guard, value }) => {
    // Prepare
    const operand: unknown = value;
    // Act
    const result = guard(operand);
    // Assess
    expect(result).toBe(true);
  });

  it.each<{ action: TimeAction; value: JSONValue }>([
    { action: 'SCHEDULE_BETWEEN_TIME_RANGE', value: null },
    {
      action: 'SCHEDULE_BETWEEN_TIME_RANGE',
      value: { START: '10:00abc', END: '23:00' },
    },
    {
      action: 'SCHEDULE_BETWEEN_TIME_RANGE',
      value: { START: '10:00', END: '23:00', TIMEZONE: 'Europe/Tokyo' },
    },
    { action: 'SCHEDULE_BETWEEN_DATETIME_RANGE', value: [] },
    {
      action: 'SCHEDULE_BETWEEN_DATETIME_RANGE',
      value: { START: '2026-06-01T17:00:00Z', END: '2026-06-01T19:00:00' },
    },
    {
      action: 'SCHEDULE_BETWEEN_DATETIME_RANGE',
      value: {
        START: '2026-06-01T17:00:00',
        END: '2026-06-01T19:00:00',
        TIMEZONE: false,
      },
    },
    { action: 'SCHEDULE_BETWEEN_DAYS_OF_WEEK', value: 'SUNDAY' },
    { action: 'SCHEDULE_BETWEEN_DAYS_OF_WEEK', value: { DAYS: ['funday'] } },
    {
      action: 'SCHEDULE_BETWEEN_DAYS_OF_WEEK',
      value: { DAYS: ['SUNDAY'], TIMEZONE: '+01:00' },
    },
  ])(
    'throws incompatible operands for malformed $action comparator values $value',
    ({ action, value }) => {
      // Prepare
      const instant = new Date('2026-06-01T18:00:00Z');
      // Act
      const act = () => timeActions[action](value, instant);
      // Assess
      expect(act).toThrow(TypeError);
      expect(act).toThrow('Incompatible operands');
    }
  );

  it.each<JSONValue>([
    null,
    {},
    { BASE: 10.5, START: 0, END: 9 },
    { BASE: 10, START: 0, END: 10 },
  ])(
    'throws incompatible operands for malformed modulo comparator value %j',
    (value) => {
      // Prepare
      const context = 7;
      // Act
      const act = () => actions.MODULO_RANGE(context, value);
      // Assess
      expect(act).toThrow(TypeError);
      expect(act).toThrow('Incompatible operands');
    }
  );
});

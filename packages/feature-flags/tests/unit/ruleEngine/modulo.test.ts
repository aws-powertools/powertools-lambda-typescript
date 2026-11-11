// Ported from Powertools for Python v3.36.0:
// tests/functional/feature_flags/_boto3/test_feature_flags.py and test_schema_validation.py.
import { describe, expect, it } from 'vitest';
import {
  ConditionEvaluationError,
  type ContextValue,
  ruleEngineStore,
} from '../../../src/index.js';
import { conditionDocument } from './scheduleFixtures.js';

describe('MODULO_RANGE', () => {
  it.each([
    { context: 3453454, base: 100, start: 0, end: 29, expected: false },
    { context: 345345435, base: 100, start: 0, end: 39, expected: true },
    { context: 345345435, base: 100, start: 10, end: 35, expected: true },
    { context: -1, base: 10, start: 9, end: 9, expected: true },
    { context: -11, base: 10, start: 9, end: 9, expected: true },
    { context: -10, base: 10, start: 0, end: 0, expected: true },
    { context: -0, base: 10, start: 0, end: 0, expected: true },
    { context: 7.5, base: 5, start: 2, end: 3, expected: true },
    { context: 7.5, base: 5, start: 2, end: 2, expected: false },
    { context: -7.5, base: 5, start: 2, end: 3, expected: true },
    {
      context: 1.9999999999999998,
      base: 100,
      start: 2,
      end: 3,
      expected: false,
    },
    { context: 100, base: 100, start: 0, end: 0, expected: true },
    { context: 110, base: 100, start: 10, end: 35, expected: true },
    { context: 136, base: 100, start: 10, end: 35, expected: false },
    { context: 109, base: 100, start: 10, end: 35, expected: false },
    { context: 99, base: 100, start: 99, end: 99, expected: true },
    { context: 0, base: 1, start: 0, end: 0, expected: true },
  ])(
    'matches inclusive Python remainder bounds for $context mod $base in $start to $end',
    async ({ context, base, start, end, expected }) => {
      // Prepare
      const store = ruleEngineStore({
        source: async () =>
          conditionDocument([
            {
              action: 'MODULO_RANGE',
              key: 'tenant_id',
              value: { BASE: base, START: start, END: end },
            },
          ]),
      });
      // Act
      const result = await store.getAll({ tenant_id: context });
      // Assess
      expect(result.my_feature).toEqual({
        found: true,
        value: expected,
        enabled: expected,
      });
    }
  );

  it.each<ContextValue>(['secret-number', '7', true, false, [], [7]])(
    'throws for non-numeric context %j without leaking operands',
    async (context) => {
      // Prepare
      const store = ruleEngineStore({
        source: async () =>
          conditionDocument([
            {
              action: 'MODULO_RANGE',
              key: 'tenant_id',
              value: { BASE: 100, START: 0, END: 29 },
            },
          ]),
      });
      // Act
      const result = store.getMany(['my_feature'], { tenant_id: context });
      // Assess
      await expect(result).rejects.toBeInstanceOf(ConditionEvaluationError);
      await expect(result).rejects.toThrow(
        "Flag 'my_feature', rule 'scheduled', key 'tenant_id', action 'MODULO_RANGE': incompatible operands"
      );
      await expect(result).rejects.not.toThrow(/secret-number|100|29/);
    }
  );

  it('never matches a missing modulo context key', async () => {
    // Prepare
    const store = ruleEngineStore({
      source: async () =>
        conditionDocument([
          {
            action: 'MODULO_RANGE',
            key: 'tenant_id',
            value: { BASE: 10, START: 0, END: 9 },
          },
        ]),
    });
    // Act
    const result = await store.getAll({});
    // Assess
    expect(result.my_feature).toEqual({
      found: true,
      value: false,
      enabled: false,
    });
  });
});

// ported from Powertools for Python 3.36.0 semantics
// Sources: Python's utilities/feature_flags action table and
// tests/functional/feature_flags/_boto3/test_feature_flags.py at v3.36.0.
// RFC #5614 supplies the checkout_v2 example and the intentional restrictions.
import type { JSONValue } from '@aws-lambda-powertools/commons/types';
import { describe, expect, it } from 'vitest';
import {
  ConditionEvaluationError,
  type ContextValue,
  type EvaluationContext,
  ruleEngineStore,
  SchemaValidationError,
} from '../../../src/index.js';

/** Reconstructs a Python functional-suite document for one Action. */
const actionDocument = (action: string, value: JSONValue): JSONValue => ({
  my_feature: {
    default: false,
    rules: {
      permitted: {
        when_match: true,
        conditions: [{ action, key: 'fact', value }],
      },
    },
  },
});

/** Carries expected outcomes reconstructed from Python's Actions and functional cases. */
type ActionFixture = {
  action: string;
  value: JSONValue;
  match: EvaluationContext;
  nonMatch: EvaluationContext;
};

/** Lists at least one matching and non-matching fixture for every non-time Action. */
const actionFixtures: ActionFixture[] = [
  {
    action: 'EQUALS',
    value: '345345435',
    match: { fact: '345345435' },
    nonMatch: { fact: '6' },
  },
  {
    action: 'NOT_EQUALS',
    value: '345345435',
    match: { fact: '' },
    nonMatch: { fact: '345345435' },
  },
  {
    action: 'KEY_GREATER_THAN_VALUE',
    value: '2021.10.31',
    match: { fact: '2021.12.25' },
    nonMatch: { fact: '2021.10.31' },
  },
  {
    action: 'KEY_GREATER_THAN_OR_EQUAL_VALUE',
    value: '2021.10.31',
    match: { fact: '2021.10.31' },
    nonMatch: { fact: '2021.04.01' },
  },
  {
    action: 'KEY_LESS_THAN_VALUE',
    value: '2021.10.31',
    match: { fact: '2021.04.01' },
    nonMatch: { fact: '2021.10.31' },
  },
  {
    action: 'KEY_LESS_THAN_OR_EQUAL_VALUE',
    value: '2021.10.31',
    match: { fact: '2021.10.31' },
    nonMatch: { fact: '2021.12.25' },
  },
  {
    action: 'STARTSWITH',
    value: 'a',
    match: { fact: 'abcd' },
    nonMatch: { fact: 'zabc' },
  },
  {
    action: 'ENDSWITH',
    value: 'z',
    match: { fact: 'az' },
    nonMatch: { fact: 'ab' },
  },
  {
    action: 'IN',
    value: ['6', '2'],
    match: { fact: '6' },
    nonMatch: { fact: '8' },
  },
  {
    action: 'KEY_IN_VALUE',
    value: ['6', '2'],
    match: { fact: '6' },
    nonMatch: { fact: '8' },
  },
  {
    action: 'NOT_IN',
    value: ['10', '4'],
    match: { fact: '6' },
    nonMatch: { fact: '10' },
  },
  {
    action: 'KEY_NOT_IN_VALUE',
    value: ['10', '4'],
    match: { fact: '6' },
    nonMatch: { fact: '10' },
  },
  {
    action: 'VALUE_IN_KEY',
    value: 'SYSADMIN',
    match: { fact: ['SYSADMIN', 'IT'] },
    nonMatch: { fact: ['GUEST'] },
  },
  {
    action: 'VALUE_NOT_IN_KEY',
    value: 'GUEST',
    match: { fact: ['SYSADMIN', 'IT'] },
    nonMatch: { fact: ['GUEST'] },
  },
  {
    action: 'ALL_IN_VALUE',
    value: ['Akua', 'John', 'Maria', 'Pat'],
    match: { fact: ['Akua'] },
    nonMatch: { fact: ['Akua', 'Mary'] },
  },
  {
    action: 'ANY_IN_VALUE',
    value: ['Akua', 'John', 'Maria', 'Pat'],
    match: { fact: ['Akua'] },
    nonMatch: { fact: ['Kwesi'] },
  },
  {
    action: 'NONE_IN_VALUE',
    value: ['Akua', 'John', 'Maria', 'Pat'],
    match: { fact: ['Mary'] },
    nonMatch: { fact: ['Pat'] },
  },
];

describe('Python 3.36.0 conformance', () => {
  describe('parity', () => {
    it.each(actionFixtures)(
      'matches the Python action-table outcomes for $action',
      async ({ action, value, match, nonMatch }) => {
        // Prepare
        const document = actionDocument(action, value);
        const store = ruleEngineStore({ source: async () => document });
        // Act
        const matched = await store.getMany(['my_feature'], match);
        const unmatched = await store.getMany(['my_feature'], nonMatch);
        // Assess
        expect(matched).toEqual({
          my_feature: { found: true, value: true, enabled: true },
        });
        expect(unmatched).toEqual({
          my_feature: { found: true, value: false, enabled: false },
        });
      }
    );

    it.each<{
      action: string;
      kind: string;
      context: ContextValue;
      value: JSONValue;
      expected: boolean;
    }>([
      {
        action: 'IN',
        kind: 'object keys',
        context: 'premium',
        value: { premium: 1 },
        expected: true,
      },
      {
        action: 'KEY_IN_VALUE',
        kind: 'object keys',
        context: 'premium',
        value: { premium: 1 },
        expected: true,
      },
      {
        action: 'NOT_IN',
        kind: 'object keys',
        context: 'premium',
        value: { premium: 1 },
        expected: false,
      },
      {
        action: 'KEY_NOT_IN_VALUE',
        kind: 'object keys',
        context: 'premium',
        value: { premium: 1 },
        expected: false,
      },
      {
        action: 'IN',
        kind: 'substrings',
        context: 'rem',
        value: 'premium',
        expected: true,
      },
      {
        action: 'KEY_IN_VALUE',
        kind: 'substrings',
        context: 'rem',
        value: 'premium',
        expected: true,
      },
      {
        action: 'NOT_IN',
        kind: 'substrings',
        context: 'gold',
        value: 'premium',
        expected: true,
      },
      {
        action: 'KEY_NOT_IN_VALUE',
        kind: 'substrings',
        context: 'rem',
        value: 'premium',
        expected: false,
      },
      {
        action: 'VALUE_IN_KEY',
        kind: 'string context',
        context: 'premium',
        value: 'rem',
        expected: true,
      },
      {
        action: 'VALUE_IN_KEY',
        kind: 'string context',
        context: 'premium',
        value: 'gold',
        expected: false,
      },
      {
        action: 'VALUE_NOT_IN_KEY',
        kind: 'string context',
        context: 'premium',
        value: 'gold',
        expected: true,
      },
      {
        action: 'VALUE_NOT_IN_KEY',
        kind: 'string context',
        context: 'premium',
        value: 'rem',
        expected: false,
      },
    ])(
      'matches Python $kind membership for $action',
      async ({ action, context, value, expected }) => {
        // Prepare
        const store = ruleEngineStore({
          source: async () => actionDocument(action, value),
        });
        // Act
        const result = await store.getAll({ fact: context });
        // Assess
        expect(result).toEqual({
          my_feature: { found: true, value: expected, enabled: expected },
        });
      }
    );

    it('matches Python code-point ordering for BMP and astral strings', async () => {
      // Prepare
      const store = ruleEngineStore({
        source: async () => actionDocument('KEY_LESS_THAN_VALUE', '😀'),
      });
      // Act
      const result = await store.getAll({ fact: '\uFFFF' });
      // Assess
      expect(result).toEqual({
        my_feature: { found: true, value: true, enabled: true },
      });
    });

    it.each([
      { action: 'EQUALS', value: 'premium' },
      { action: 'NOT_EQUALS', value: 'premium' },
      { action: 'NOT_IN', value: ['premium', 'enterprise'] },
      { action: 'KEY_NOT_IN_VALUE', value: ['premium', 'enterprise'] },
      { action: 'VALUE_NOT_IN_KEY', value: 'premium' },
      { action: 'NONE_IN_VALUE', value: ['premium'] },
      { action: 'ANY_IN_VALUE', value: ['premium'] },
    ])(
      'treats a missing key as a non-match for $action',
      async ({ action, value }) => {
        // Prepare
        const store = ruleEngineStore({
          source: async () => actionDocument(action, value),
        });
        // Act
        const result = await store.getMany(['my_feature'], { username: 'a' });
        // Assess
        expect(result).toEqual({
          my_feature: { found: true, value: false, enabled: false },
        });
      }
    );

    it.each([
      { context: { tenant_id: '6', username: 'abcd' }, expected: true },
      { context: { tenant_id: '4446', username: 'az' }, expected: true },
      { context: { tenant_id: '11114446', username: 'ab' }, expected: false },
    ])(
      'preserves the functional-suite multi-Rule AND outcomes for $context',
      async ({ context, expected }) => {
        // Prepare
        const document = {
          my_feature: {
            default: false,
            rules: {
              'tenant id equals 6 and username startswith a': {
                when_match: true,
                conditions: [
                  { action: 'EQUALS', key: 'tenant_id', value: '6' },
                  { action: 'STARTSWITH', key: 'username', value: 'a' },
                ],
              },
              'tenant id equals 4446 and username startswith a and endswith z':
                {
                  when_match: true,
                  conditions: [
                    { action: 'EQUALS', key: 'tenant_id', value: '4446' },
                    { action: 'STARTSWITH', key: 'username', value: 'a' },
                    { action: 'ENDSWITH', key: 'username', value: 'z' },
                  ],
                },
            },
          },
        };
        const store = ruleEngineStore({ source: async () => document });
        // Act
        const result = await store.getMany(['my_feature'], context);
        // Assess
        expect(result).toEqual({
          my_feature: { found: true, value: expected, enabled: expected },
        });
      }
    );

    it.each([
      { context: { tier: 'premium' }, expected: true },
      { context: { tier: 'standard' }, expected: false },
    ])(
      'evaluates the RFC checkout_v2 document for $context',
      async ({ context, expected }) => {
        // Prepare
        const document = {
          checkout_v2: {
            default: false,
            rules: {
              premium_customers: {
                when_match: true,
                conditions: [
                  { action: 'EQUALS', key: 'tier', value: 'premium' },
                ],
              },
            },
          },
        };
        const store = ruleEngineStore({ source: async () => document });
        // Act
        const result = await store.getMany(['checkout_v2'], context);
        // Assess
        expect(result).toEqual({
          checkout_v2: { found: true, value: expected, enabled: expected },
        });
      }
    );

    it('returns the Python beyond-boolean premium feature list', async () => {
      // Prepare
      const document = {
        premium_features: {
          boolean_type: false,
          default: [],
          rules: {
            'customer tier equals premium': {
              when_match: ['no_ads', 'no_limits', 'chat'],
              conditions: [{ action: 'EQUALS', key: 'tier', value: 'premium' }],
            },
          },
        },
      };
      const store = ruleEngineStore({ source: async () => document });
      // Act
      const matched = await store.getAll({ tier: 'premium' });
      const unmatched = await store.getAll({ tier: 'standard' });
      // Assess
      expect(matched).toEqual({
        premium_features: {
          found: true,
          value: ['no_ads', 'no_limits', 'chat'],
          enabled: true,
        },
      });
      expect(unmatched).toEqual({
        premium_features: { found: true, value: [], enabled: false },
      });
    });

    it('preserves Python truthiness for empty and nonempty JSON objects', async () => {
      // Prepare
      const document = {
        my_truthy_feature: { default: { a: 'b' }, boolean_type: false },
        my_falsy_feature: { default: {}, boolean_type: false },
      };
      const store = ruleEngineStore({ source: async () => document });
      // Act
      const result = await store.getAll({});
      // Assess
      expect(result).toEqual({
        my_truthy_feature: { found: true, value: { a: 'b' }, enabled: true },
        my_falsy_feature: { found: true, value: {}, enabled: false },
      });
    });

    it('preserves first-match priority for overlapping named Rules', async () => {
      // Prepare
      const document = {
        my_feature: {
          boolean_type: false,
          default: [],
          rules: {
            first: {
              when_match: ['first'],
              conditions: [{ action: 'STARTSWITH', key: 'tier', value: 'pre' }],
            },
            second: {
              when_match: ['second'],
              conditions: [{ action: 'EQUALS', key: 'tier', value: 'premium' }],
            },
          },
        },
      };
      const store = ruleEngineStore({ source: async () => document });
      // Act
      const result = await store.getAll({ tier: 'premium' });
      // Assess
      expect(result).toEqual({
        my_feature: { found: true, value: ['first'], enabled: true },
      });
    });
  });

  describe('documented differences from Python', () => {
    it.each([
      { action: 'EQUALS', context: true, value: 1, expected: false },
      { action: 'NOT_EQUALS', context: true, value: 1, expected: true },
      { action: 'IN', context: true, value: [1], expected: false },
      { action: 'KEY_IN_VALUE', context: true, value: [1], expected: false },
      { action: 'NOT_IN', context: true, value: [1], expected: true },
      { action: 'KEY_NOT_IN_VALUE', context: true, value: [1], expected: true },
      { action: 'VALUE_IN_KEY', context: [true], value: 1, expected: false },
      { action: 'VALUE_NOT_IN_KEY', context: [true], value: 1, expected: true },
      { action: 'ALL_IN_VALUE', context: [true], value: [1], expected: false },
      { action: 'ANY_IN_VALUE', context: [true], value: [1], expected: false },
      { action: 'NONE_IN_VALUE', context: [true], value: [1], expected: true },
    ])(
      'uses strict boolean/number equality for $action',
      async ({ action, context, value, expected }) => {
        // Prepare
        const store = ruleEngineStore({
          source: async () => actionDocument(action, value),
        });
        // Act
        const result = await store.getAll({ fact: context });
        // Assess
        expect(result).toEqual({
          my_feature: { found: true, value: expected, enabled: expected },
        });
      }
    );

    it.each([
      { action: 'STARTSWITH', context: 1, value: 100 },
      { action: 'KEY_LESS_THAN_VALUE', context: 'string', value: 100 },
      { action: 'IN', context: 1, value: 'premium' },
      {
        action: 'ALL_IN_VALUE',
        context: 'not a list value',
        value: ['Akua', 'John', 'Maria', 'Pat'],
      },
      {
        action: 'ANY_IN_VALUE',
        context: 'not a list value',
        value: ['Akua', 'John', 'Maria', 'Pat'],
      },
      {
        action: 'NONE_IN_VALUE',
        context: 'not a list value',
        value: ['Akua', 'John', 'Maria', 'Pat'],
      },
    ])(
      'throws for incompatible $action operands instead of returning a non-match',
      async ({ action, context, value }) => {
        // Prepare
        const store = ruleEngineStore({
          source: async () => actionDocument(action, value),
        });
        // Act
        const result = store.getAll({ fact: context });
        // Assess
        await expect(result).rejects.toBeInstanceOf(ConditionEvaluationError);
      }
    );

    it.each(['0', '2', '10'])(
      'rejects numeric Rule name %s instead of changing its priority',
      async (ruleName) => {
        // Prepare
        const document = {
          my_feature: {
            default: false,
            rules: {
              [ruleName]: {
                when_match: true,
                conditions: [
                  { action: 'EQUALS', key: 'tier', value: 'premium' },
                ],
              },
            },
          },
        };
        const store = ruleEngineStore({ source: async () => document });
        // Act
        const result = store.getAll({ tier: 'premium' });
        // Assess
        await expect(result).rejects.toBeInstanceOf(SchemaValidationError);
        await expect(result).rejects.toThrow(
          `Flag 'my_feature', rule '${ruleName}'`
        );
      }
    );

    it.each([null, false, 0, '', []])(
      'rejects falsy non-object rules %j instead of treating them as absent',
      async (rules) => {
        // Prepare
        const document = { my_feature: { default: false, rules } };
        const store = ruleEngineStore({ source: async () => document });
        // Act
        const result = store.getAll({});
        // Assess
        await expect(result).rejects.toBeInstanceOf(SchemaValidationError);
        await expect(result).rejects.toThrow(
          "Flag 'my_feature' rules must be an object"
        );
      }
    );
  });
});

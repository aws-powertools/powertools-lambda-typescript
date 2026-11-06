import type { JSONValue } from '@aws-lambda-powertools/commons/types';
import { describe, expect, it, vi } from 'vitest';
import {
  ConditionEvaluationError,
  type ContextValue,
} from '../../../src/index.js';
import { evaluate } from '../../../src/ruleEngine/evaluate.js';
import type { Flag, RuleAction } from '../../../src/ruleEngine/types.js';

/** Creates an isolated boolean flag for a comparator test. */
const prepareFlag = (action: RuleAction, value: JSONValue): Flag => ({
  default: false,
  rules: {
    premium: { when_match: true, conditions: [{ action, key: 'tier', value }] },
  },
});

/** Exercises comparisons with supported context values and JSON document operands. */
const evaluateCondition = (
  action: RuleAction,
  context: ContextValue,
  value: JSONValue
) => {
  const flag = prepareFlag(action, value);
  return evaluate('checkout', flag, { tier: context });
};

describe('Rule Engine evaluation', () => {
  it('returns the first matching Rule in insertion order', () => {
    // Prepare
    const flag: Flag = {
      default: 0,
      rules: {
        rule_10: {
          when_match: 10,
          conditions: [{ action: 'EQUALS', key: 'tier', value: 'premium' }],
        },
        rule_2: {
          when_match: 2,
          conditions: [{ action: 'EQUALS', key: 'tier', value: 'premium' }],
        },
      },
    };
    // Act
    const result = evaluate('checkout', flag, { tier: 'premium' });
    // Assess
    expect(result).toEqual({ found: true, value: 10, enabled: true });
  });

  it.each([
    { context: { tier: 'premium', optedIn: true }, expected: true },
    { context: { tier: 'standard', optedIn: true }, expected: false },
    { context: { tier: 'premium', optedIn: false }, expected: false },
  ])('ANDs Conditions for context $context', ({ context, expected }) => {
    // Prepare
    const flag = prepareFlag('EQUALS', 'premium');
    flag.rules.premium.conditions.push({
      action: 'EQUALS',
      key: 'optedIn',
      value: true,
    });
    // Act
    const result = evaluate('checkout', flag, context);
    // Assess
    expect(result).toEqual({ found: true, value: expected, enabled: expected });
  });

  it('continues to later Rules after an earlier Rule fails', () => {
    // Prepare
    const flag = prepareFlag('EQUALS', 'standard');
    flag.rules.next = {
      when_match: 'matched',
      conditions: [{ action: 'EQUALS', key: 'tier', value: 'premium' }],
    };
    // Act
    const result = evaluate('checkout', flag, { tier: 'premium' });
    // Assess
    expect(result).toEqual({ found: true, value: 'matched', enabled: true });
  });

  it('short-circuits later Conditions after a non-match', () => {
    // Prepare
    const flag = prepareFlag('EQUALS', 'standard');
    flag.rules.premium.conditions.push({
      action: 'STARTSWITH',
      key: 'tier',
      value: 123,
    });
    // Act
    const result = evaluate('checkout', flag, { tier: 'premium' });
    // Assess
    expect(result).toEqual({ found: true, value: false, enabled: false });
  });

  it('short-circuits later Rules after a match', () => {
    // Prepare
    const flag = prepareFlag('EQUALS', 'premium');
    flag.rules.next = {
      when_match: false,
      conditions: [{ action: 'STARTSWITH', key: 'tier', value: 123 }],
    };
    // Act
    const result = evaluate('checkout', flag, { tier: 'premium' });
    // Assess
    expect(result).toEqual({ found: true, value: true, enabled: true });
  });

  it.each<RuleAction>([
    'EQUALS',
    'NOT_EQUALS',
    'NOT_IN',
    'KEY_NOT_IN_VALUE',
    'VALUE_NOT_IN_KEY',
    'NONE_IN_VALUE',
    'STARTSWITH',
  ])('never matches a missing key for %s', (action) => {
    // Prepare
    const flag = prepareFlag(action, null);
    // Act
    const result = evaluate('checkout', flag, {});
    // Assess
    expect(result).toEqual({ found: true, value: false, enabled: false });
  });

  it('ignores inherited context keys', () => {
    // Prepare
    const flag = prepareFlag('EQUALS', 'premium');
    const context = Object.create({ tier: 'premium' });
    // Act
    const result = evaluate('checkout', flag, context);
    // Assess
    expect(result).toEqual({ found: true, value: false, enabled: false });
  });

  it.each<{ value: JSONValue; enabled: boolean }>([
    { value: true, enabled: true },
    { value: 1, enabled: true },
    { value: 'x', enabled: true },
    { value: [1], enabled: true },
    { value: { a: 1 }, enabled: true },
    { value: [false], enabled: true },
    { value: false, enabled: false },
    { value: 0, enabled: false },
    { value: '', enabled: false },
    { value: [], enabled: false },
    { value: {}, enabled: false },
    { value: null, enabled: false },
  ])('derives enabled from the Flag Default $value', ({ value, enabled }) => {
    // Prepare
    const flag: Flag = { default: value, rules: {} };
    // Act
    const result = evaluate('checkout', flag, {});
    // Assess
    expect(result).toEqual({ found: true, value, enabled });
  });

  it.each<{ value: JSONValue; enabled: boolean }>([
    { value: [], enabled: false },
    { value: {}, enabled: false },
    { value: null, enabled: false },
    { value: [false], enabled: true },
  ])(
    'derives enabled from a matching Rule result $value',
    ({ value, enabled }) => {
      // Prepare
      const flag = prepareFlag('EQUALS', 'premium');
      flag.rules.premium.when_match = value;
      // Act
      const result = evaluate('checkout', flag, { tier: 'premium' });
      // Assess
      expect(result).toEqual({ found: true, value, enabled });
    }
  );

  it.each<{
    action: RuleAction;
    context: ContextValue;
    value: JSONValue;
    expected: boolean;
  }>([
    { action: 'EQUALS', context: 'premium', value: 'premium', expected: true },
    { action: 'EQUALS', context: true, value: 1, expected: false },
    {
      action: 'EQUALS',
      context: 'premium',
      value: { tier: 'premium' },
      expected: false,
    },
    { action: 'EQUALS', context: [1, 2], value: [2, 1], expected: false },
    { action: 'NOT_EQUALS', context: true, value: 1, expected: true },
    {
      action: 'NOT_EQUALS',
      context: 'premium',
      value: { tier: 'premium' },
      expected: true,
    },
    {
      action: 'NOT_EQUALS',
      context: 'premium',
      value: 'premium',
      expected: false,
    },
    { action: 'KEY_GREATER_THAN_VALUE', context: 2, value: 1, expected: true },
    { action: 'KEY_GREATER_THAN_VALUE', context: 1, value: 1, expected: false },
    {
      action: 'KEY_GREATER_THAN_VALUE',
      context: 'b',
      value: 'a',
      expected: true,
    },
    {
      action: 'KEY_GREATER_THAN_VALUE',
      context: 'a',
      value: 'b',
      expected: false,
    },
    {
      action: 'KEY_GREATER_THAN_OR_EQUAL_VALUE',
      context: 1,
      value: 1,
      expected: true,
    },
    {
      action: 'KEY_GREATER_THAN_OR_EQUAL_VALUE',
      context: 1,
      value: 2,
      expected: false,
    },
    {
      action: 'KEY_GREATER_THAN_OR_EQUAL_VALUE',
      context: 'b',
      value: 'a',
      expected: true,
    },
    { action: 'KEY_LESS_THAN_VALUE', context: 1, value: 2, expected: true },
    { action: 'KEY_LESS_THAN_VALUE', context: 1, value: 1, expected: false },
    { action: 'KEY_LESS_THAN_VALUE', context: 'a', value: 'b', expected: true },
    {
      action: 'KEY_LESS_THAN_OR_EQUAL_VALUE',
      context: 1,
      value: 1,
      expected: true,
    },
    {
      action: 'KEY_LESS_THAN_OR_EQUAL_VALUE',
      context: 2,
      value: 1,
      expected: false,
    },
    {
      action: 'KEY_LESS_THAN_OR_EQUAL_VALUE',
      context: 'a',
      value: 'b',
      expected: true,
    },
    { action: 'STARTSWITH', context: 'premium', value: 'pre', expected: true },
    {
      action: 'STARTSWITH',
      context: 'premium',
      value: 'mium',
      expected: false,
    },
    { action: 'STARTSWITH', context: 'premium', value: '', expected: true },
    { action: 'ENDSWITH', context: 'premium', value: 'mium', expected: true },
    { action: 'ENDSWITH', context: 'premium', value: 'pre', expected: false },
    {
      action: 'IN',
      context: 'premium',
      value: ['premium', 'standard'],
      expected: true,
    },
    { action: 'IN', context: true, value: [1], expected: false },
    {
      action: 'IN',
      context: 'a',
      value: [{ a: 1 }, 'a'],
      expected: true,
    },
    { action: 'IN', context: 'b', value: [{ b: 1 }], expected: false },
    {
      action: 'KEY_IN_VALUE',
      context: [1, 2],
      value: [[1, 2]],
      expected: true,
    },
    {
      action: 'KEY_IN_VALUE',
      context: [1, 2],
      value: [[2, 1]],
      expected: false,
    },
    { action: 'NOT_IN', context: true, value: [1], expected: true },
    {
      action: 'NOT_IN',
      context: 'premium',
      value: ['premium'],
      expected: false,
    },
    {
      action: 'KEY_NOT_IN_VALUE',
      context: 'premium',
      value: ['standard'],
      expected: true,
    },
    {
      action: 'KEY_NOT_IN_VALUE',
      context: 'premium',
      value: ['premium'],
      expected: false,
    },
    {
      action: 'VALUE_IN_KEY',
      context: ['x', 'y'],
      value: { x: 1 },
      expected: false,
    },
    { action: 'VALUE_IN_KEY', context: [1], value: true, expected: false },
    { action: 'VALUE_NOT_IN_KEY', context: [1], value: true, expected: true },
    {
      action: 'VALUE_NOT_IN_KEY',
      context: ['premium'],
      value: 'premium',
      expected: false,
    },
    {
      action: 'ALL_IN_VALUE',
      context: [1, 2],
      value: [2, 1, 3],
      expected: true,
    },
    { action: 'ALL_IN_VALUE', context: [1, 4], value: [1, 2], expected: false },
    { action: 'ALL_IN_VALUE', context: [], value: [], expected: true },
    { action: 'ALL_IN_VALUE', context: [true], value: [1], expected: false },
    { action: 'ANY_IN_VALUE', context: [1, 4], value: [1, 2], expected: true },
    { action: 'ANY_IN_VALUE', context: [4], value: [1, 2], expected: false },
    { action: 'ANY_IN_VALUE', context: [], value: [], expected: false },
    {
      action: 'ANY_IN_VALUE',
      context: ['a'],
      value: [{ a: 1 }, 'a'],
      expected: true,
    },
    { action: 'NONE_IN_VALUE', context: [4], value: [1, 2], expected: true },
    { action: 'NONE_IN_VALUE', context: [1], value: [1, 2], expected: false },
    { action: 'NONE_IN_VALUE', context: [], value: [], expected: true },
  ])(
    'evaluates $action with context $context and value $value as $expected',
    ({ action, context, value, expected }) => {
      // Prepare
      const act = () => evaluateCondition(action, context, value);
      // Act
      const result = act();
      // Assess
      expect(result).toEqual({
        found: true,
        value: expected,
        enabled: expected,
      });
    }
  );

  it.each<{ action: RuleAction; context: ContextValue; value: JSONValue }>([
    {
      action: 'KEY_GREATER_THAN_VALUE',
      context: 'secret-context',
      value: 987654,
    },
    { action: 'KEY_GREATER_THAN_VALUE', context: true, value: 987654 },
    {
      action: 'KEY_GREATER_THAN_OR_EQUAL_VALUE',
      context: 987654,
      value: 'secret-operand',
    },
    { action: 'KEY_LESS_THAN_VALUE', context: [], value: 'secret-operand' },
    {
      action: 'KEY_LESS_THAN_OR_EQUAL_VALUE',
      context: 'secret-context',
      value: {},
    },
    { action: 'STARTSWITH', context: 987654, value: 'secret-operand' },
    { action: 'STARTSWITH', context: 'secret-context', value: 987654 },
    { action: 'ENDSWITH', context: 'secret-context', value: null },
    { action: 'IN', context: 'secret-context', value: 'secret-operand' },
    { action: 'KEY_IN_VALUE', context: 'secret-context', value: {} },
    { action: 'NOT_IN', context: 'secret-context', value: 987654 },
    { action: 'KEY_NOT_IN_VALUE', context: 'secret-context', value: null },
    {
      action: 'VALUE_IN_KEY',
      context: 'secret-context',
      value: 'secret-operand',
    },
    { action: 'VALUE_NOT_IN_KEY', context: 987654, value: 'secret-operand' },
    { action: 'ALL_IN_VALUE', context: 'secret-context', value: [] },
    { action: 'ALL_IN_VALUE', context: [], value: 'secret-operand' },
    { action: 'ANY_IN_VALUE', context: 'secret-context', value: [] },
    { action: 'ANY_IN_VALUE', context: [], value: 'secret-operand' },
    { action: 'NONE_IN_VALUE', context: 'secret-context', value: [] },
    { action: 'NONE_IN_VALUE', context: [], value: 'secret-operand' },
  ])(
    'throws a private error for incompatible $action operands $context and $value',
    ({ action, context, value }) => {
      // Prepare
      const flag = prepareFlag(action, value);
      // Act
      const act = () => {
        return evaluate('checkout', flag, { tier: context });
      };
      // Assess
      expect(act).toThrow(ConditionEvaluationError);
      expect(act).toThrow(
        `Flag 'checkout', rule 'premium', key 'tier', action '${action}': incompatible operands`
      );
      expect(act).not.toThrow(/secret-context|secret-operand|987654/);
    }
  );

  it.each<{ action: RuleAction; expected: boolean }>([
    { action: 'KEY_GREATER_THAN_VALUE', expected: false },
    { action: 'KEY_GREATER_THAN_OR_EQUAL_VALUE', expected: false },
    { action: 'KEY_LESS_THAN_VALUE', expected: true },
    { action: 'KEY_LESS_THAN_OR_EQUAL_VALUE', expected: true },
  ])('uses Unicode code-point ordering for $action', ({ action, expected }) => {
    // Prepare
    const flag = prepareFlag(action, '😀');
    const context = { tier: '\uFFFF' };
    // Act
    const result = evaluate('checkout', flag, context);
    // Assess
    expect(result).toEqual({ found: true, value: expected, enabled: expected });
  });

  it('logs the selected Rule without result or operand values', () => {
    // Prepare
    const flag = prepareFlag('EQUALS', 'secret-value');
    const logger = {
      debug: vi.fn(),
      warn: vi.fn(),
      info: vi.fn(),
      error: vi.fn(),
    };
    // Act
    evaluate('checkout', flag, { tier: 'secret-value' }, logger);
    // Assess
    expect(logger.debug).toHaveBeenCalledExactlyOnceWith({
      store: 'rule-engine',
      name: 'checkout',
      outcome: 'rule',
      rule: 'premium',
    });
  });
});

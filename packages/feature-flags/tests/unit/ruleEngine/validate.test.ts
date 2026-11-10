import { describe, expect, it, vi } from 'vitest';
import { SchemaValidationError } from '../../../src/index.js';
import { validate } from '../../../src/ruleEngine/validate.js';

/** Creates a valid flag with one Rule and replaces selected flag fields. */
const documentWith = (fields: Record<string, unknown> = {}) => ({
  checkout: {
    default: false,
    rules: {
      premium: {
        when_match: true,
        conditions: [{ action: 'EQUALS', key: 'tier', value: 'premium' }],
      },
    },
    ...fields,
  },
});

/** Creates a flag with a supplied Rule definition. */
const documentWithRule = (rule: unknown) =>
  documentWith({ rules: { premium: rule } });

/** Creates a flag with a supplied Condition definition. */
const documentWithCondition = (condition: unknown) =>
  documentWithRule({ when_match: true, conditions: [condition] });

/** Creates an isolated logger for validation warnings. */
const prepareLogger = () => ({
  debug: vi.fn(),
  warn: vi.fn(),
  info: vi.fn(),
  error: vi.fn(),
});

describe('Rule Engine validation', () => {
  it.each([[], null, true, 1, 'document', undefined])(
    'rejects non-object document %j',
    (document) => {
      // Prepare
      const logger = prepareLogger();
      // Act
      const act = () => validate(document, logger);
      // Assess
      expect(act).toThrow(SchemaValidationError);
      expect(act).toThrow('Flag Document must be an object');
      expect(logger.warn).not.toHaveBeenCalled();
    }
  );

  it.each([{}, [], null, true, 1, 'secret-flag', { rules: {} }])(
    'rejects malformed flag %j',
    (flag) => {
      // Prepare
      const document = { checkout: flag };
      // Act
      const act = () => validate(document);
      // Assess
      expect(act).toThrow(SchemaValidationError);
      expect(act).toThrow("Flag 'checkout' must be an object with a default");
      expect(act).not.toThrow('secret-flag');
    }
  );

  it.each([null, 1, 'secret-type', [], {}, undefined])(
    'rejects non-boolean boolean_type %j',
    (booleanType) => {
      // Prepare
      const document = documentWith({ boolean_type: booleanType });
      // Act
      const act = () => validate(document);
      // Assess
      expect(act).toThrow(SchemaValidationError);
      expect(act).toThrow("Flag 'checkout' boolean_type must be a boolean");
      expect(act).not.toThrow('secret-type');
    }
  );

  it.each([null, 0, 'secret-default', [], {}, undefined])(
    'requires a boolean default without boolean_type for %j',
    (value) => {
      // Prepare
      const document = documentWith({ default: value });
      // Act
      const act = () => validate(document);
      // Assess
      expect(act).toThrow(SchemaValidationError);
      expect(act).toThrow("Flag 'checkout' default must be a boolean");
      expect(act).not.toThrow('secret-default');
    }
  );

  it.each([null, 1, 'secret-match', [], {}, undefined])(
    'requires a boolean when_match for %j',
    (value) => {
      // Prepare
      const document = documentWithRule({
        when_match: value,
        conditions: [{ action: 'EQUALS', key: 'tier', value: 1 }],
      });
      // Act
      const act = () => validate(document);
      // Assess
      expect(act).toThrow(SchemaValidationError);
      expect(act).toThrow(
        "Flag 'checkout', rule 'premium' when_match must be a boolean"
      );
      expect(act).not.toThrow('secret-match');
    }
  );

  it.each([false, true])(
    'accepts explicit boolean_type true with default %j',
    (value) => {
      // Prepare
      const document = documentWith({ boolean_type: true, default: value });
      // Act
      const result = validate(document);
      // Assess
      expect(result.checkout.default).toBe(value);
    }
  );

  it.each([
    null,
    true,
    false,
    0,
    1,
    '',
    'x',
    [],
    [1, { a: null }],
    {},
    { a: [false, 'x'] },
  ])('accepts JSON results with boolean_type false for %j', (value) => {
    // Prepare
    const document = documentWith({
      boolean_type: false,
      default: value,
      rules: {
        premium: {
          when_match: value,
          conditions: [{ action: 'EQUALS', key: 'tier', value: null }],
        },
      },
    });
    // Act
    const result = validate(document);
    // Assess
    expect(result.checkout.default).toEqual(value);
    expect(result.checkout.rules.premium.when_match).toEqual(value);
    expect(result.checkout.rules.premium.conditions[0].value).toBeNull();
  });

  it.each([[], null, false, 0, '', 'secret-rules', undefined])(
    'rejects non-object rules %j',
    (rules) => {
      // Prepare
      const document = documentWith({ rules });
      // Act
      const act = () => validate(document);
      // Assess
      expect(act).toThrow(SchemaValidationError);
      expect(act).toThrow("Flag 'checkout' rules must be an object");
      expect(act).not.toThrow('secret-rules');
    }
  );

  it.each(['', '0', '2', '10', '4294967294'])(
    'rejects rule name %j that cannot preserve priority',
    (ruleName) => {
      // Prepare
      const document = documentWith({
        rules: {
          [ruleName]: {
            when_match: true,
            conditions: [{ action: 'EQUALS', key: 'tier', value: 1 }],
          },
        },
      });
      // Act
      const act = () => validate(document);
      // Assess
      expect(act).toThrow(SchemaValidationError);
      expect(act).toThrow(
        `Flag 'checkout', rule '${ruleName}' must use a non-empty name that preserves insertion order`
      );
    }
  );

  it.each(['rule_10', '01', '-1', '4294967295', '9007199254740992'])(
    'accepts insertion-ordered rule name %j',
    (ruleName) => {
      // Prepare
      const rule = {
        when_match: true,
        conditions: [{ action: 'EQUALS', key: 'tier', value: 1 }],
      };
      const document = documentWith({ rules: { [ruleName]: rule } });
      // Act
      const result = validate(document);
      // Assess
      expect(Object.keys(result.checkout.rules)).toEqual([ruleName]);
    }
  );

  it.each([{}, [], null, true, 'secret-rule', { conditions: [] }])(
    'rejects malformed rule %j',
    (rule) => {
      // Prepare
      const document = documentWithRule(rule);
      // Act
      const act = () => validate(document);
      // Assess
      expect(act).toThrow(SchemaValidationError);
      expect(act).toThrow(
        "Flag 'checkout', rule 'premium' must be an object with when_match"
      );
      expect(act).not.toThrow('secret-rule');
    }
  );

  it.each([undefined, [], {}, null, false, 'secret-conditions'])(
    'rejects missing or malformed conditions %j',
    (conditions) => {
      // Prepare
      const document = documentWithRule({ when_match: true, conditions });
      // Act
      const act = () => validate(document);
      // Assess
      expect(act).toThrow(SchemaValidationError);
      expect(act).toThrow(
        "Flag 'checkout', rule 'premium' conditions must be a non-empty array"
      );
      expect(act).not.toThrow('secret-conditions');
    }
  );

  it.each([[], null, true, 1, 'secret-condition', undefined])(
    'rejects non-object condition %j',
    (condition) => {
      // Prepare
      const document = documentWithCondition(condition);
      // Act
      const act = () => validate(document);
      // Assess
      expect(act).toThrow(SchemaValidationError);
      expect(act).toThrow(
        "Flag 'checkout', rule 'premium', condition 0 must be an object"
      );
      expect(act).not.toThrow('secret-condition');
    }
  );

  it('identifies the malformed second Condition in a three-Condition Rule', () => {
    // Prepare
    const validCondition = {
      action: 'EQUALS',
      key: 'tier',
      value: 'secret-operand',
    };
    const document = documentWithRule({
      when_match: true,
      conditions: [validCondition, null, validCondition],
    });
    // Act
    const act = () => validate(document);
    // Assess
    expect(act).toThrow(SchemaValidationError);
    expect(act).toThrow(
      "Flag 'checkout', rule 'premium', condition 1 must be an object"
    );
    expect(act).not.toThrow('secret-operand');
  });

  it.each([{}, { action: null }, { action: 1 }, { action: [] }])(
    'rejects missing or non-string action %j',
    (fields) => {
      // Prepare
      const document = documentWithCondition({
        key: 'tier',
        value: 'secret-operand',
        ...fields,
      });
      // Act
      const act = () => validate(document);
      // Assess
      expect(act).toThrow(SchemaValidationError);
      expect(act).toThrow(
        "Flag 'checkout', rule 'premium', condition 0, key 'tier', action '<invalid>' action must be a string"
      );
      expect(act).not.toThrow('secret-operand');
    }
  );

  it.each(['UNKNOWN_ACTION', '', 'toString', '__proto__'])(
    'rejects unknown action %j by name',
    (action) => {
      // Prepare
      const document = documentWithCondition({
        action,
        key: 'tier',
        value: 'secret-operand',
      });
      // Act
      const act = () => validate(document);
      // Assess
      expect(act).toThrow(SchemaValidationError);
      expect(act).toThrow(
        `Flag 'checkout', rule 'premium', condition 0, key 'tier', action '${action}' action is unknown`
      );
      expect(act).not.toThrow('secret-operand');
    }
  );

  it.each([undefined, null, 1, false, [], {}, ''])(
    'rejects missing or invalid key %j',
    (key) => {
      // Prepare
      const document = documentWithCondition({
        action: 'EQUALS',
        key,
        value: 'secret-operand',
      });
      // Act
      const act = () => validate(document);
      // Assess
      expect(act).toThrow(SchemaValidationError);
      expect(act).toThrow(
        `Flag 'checkout', rule 'premium', condition 0, key '${typeof key === 'string' ? key : '<invalid>'}', action 'EQUALS' key must be a non-empty string`
      );
      expect(act).not.toThrow('secret-operand');
    }
  );

  it('rejects a missing value', () => {
    // Prepare
    const document = documentWithCondition({ action: 'EQUALS', key: 'tier' });
    // Act
    const act = () => validate(document);
    // Assess
    expect(act).toThrow(SchemaValidationError);
    expect(act).toThrow(
      "Flag 'checkout', rule 'premium', condition 0, key 'tier', action 'EQUALS' value must be present and contain JSON"
    );
  });

  it.each(['ALL_IN_VALUE', 'ANY_IN_VALUE', 'NONE_IN_VALUE'])(
    'requires array value for %s',
    (action) => {
      // Prepare
      const document = documentWithCondition({
        action,
        key: 'tier',
        value: 'secret-operand',
      });
      // Act
      const act = () => validate(document);
      // Assess
      expect(act).toThrow(SchemaValidationError);
      expect(act).toThrow(
        `Flag 'checkout', rule 'premium', condition 0, key 'tier', action '${action}' value must be an array`
      );
      expect(act).not.toThrow('secret-operand');
    }
  );

  it.each(['ALL_IN_VALUE', 'ANY_IN_VALUE', 'NONE_IN_VALUE'])(
    'accepts an empty array value for %s',
    (action) => {
      // Prepare
      const document = documentWithCondition({
        action,
        key: 'tier',
        value: [],
      });
      // Act
      const result = validate(document);
      // Assess
      expect(result.checkout.rules.premium.conditions[0].value).toEqual([]);
    }
  );

  it.each([
    undefined,
    () => 'secret-json',
    Symbol('secret-json'),
    Number.NaN,
    Number.POSITIVE_INFINITY,
    { secret: undefined },
    Array(1),
    new Date(),
  ])('rejects non-JSON value %j at each value boundary', (value) => {
    // Prepare
    const invalidDefault = documentWith({
      boolean_type: false,
      default: value,
    });
    const invalidMatch = documentWith({
      boolean_type: false,
      rules: {
        premium: {
          when_match: value,
          conditions: [{ action: 'EQUALS', key: 'tier', value: null }],
        },
      },
    });
    const invalidCondition = documentWithCondition({
      action: 'EQUALS',
      key: 'tier',
      value,
    });
    // Act
    const acts = [
      () => validate(invalidDefault),
      () => validate(invalidMatch),
      () => validate(invalidCondition),
    ];
    // Assess
    for (const act of acts) {
      expect(act).toThrow(SchemaValidationError);
      expect(act).not.toThrow('secret-json');
    }
  });

  it('rejects circular JSON values without leaking their contents', () => {
    // Prepare
    const value: Record<string, unknown> = { secret: 'secret-cycle' };
    value.self = value;
    const document = documentWith({ boolean_type: false, default: value });
    // Act
    const act = () => validate(document);
    // Assess
    expect(act).toThrow(SchemaValidationError);
    expect(act).toThrow("Flag 'checkout' default must contain JSON");
    expect(act).not.toThrow('secret-cycle');
  });

  it('accepts shared JSON containers without treating them as cycles', () => {
    // Prepare
    const value = { shared: [1] };
    const document = documentWith({
      boolean_type: false,
      default: [value, value],
    });
    // Act
    const result = validate(document);
    // Assess
    expect(result.checkout.default).toEqual([value, value]);
  });

  it('accepts an empty document with one private warning', () => {
    // Prepare
    const logger = prepareLogger();
    // Act
    const result = validate({}, logger);
    // Assess
    expect(result).toEqual({});
    expect(logger.warn).toHaveBeenCalledExactlyOnceWith({
      store: 'rule-engine',
      reason: 'empty-document',
    });
    expect(logger.debug).not.toHaveBeenCalled();
  });

  it('accepts empty rules with one private warning', () => {
    // Prepare
    const logger = prepareLogger();
    const document = documentWith({ rules: {}, default: true });
    // Act
    const result = validate(document, logger);
    // Assess
    expect(result.checkout).toEqual({ default: true, rules: {} });
    expect(logger.warn).toHaveBeenCalledExactlyOnceWith({
      store: 'rule-engine',
      reason: 'empty-rules',
      name: 'checkout',
    });
  });

  it('accepts omitted rules without warning', () => {
    // Prepare
    const logger = prepareLogger();
    const document = { checkout: { default: true } };
    // Act
    const result = validate(document, logger);
    // Assess
    expect(result.checkout).toEqual({ default: true, rules: {} });
    expect(logger.warn).not.toHaveBeenCalled();
  });

  it.each([{}, { checkout: { default: false, rules: {} } }])(
    'emits nothing without a logger for accepted empty input %j',
    (document) => {
      // Prepare
      const act = () => validate(document);
      // Act
      act();
      // Assess
      expect(console.warn).not.toHaveBeenCalled();
      expect(console.debug).not.toHaveBeenCalled();
    }
  );

  it('ignores unknown fields at every document level', () => {
    // Prepare
    const document = documentWith({
      extra: 'secret-extra',
      rules: {
        premium: {
          when_match: true,
          extra: null,
          conditions: [
            { action: 'EQUALS', key: 'tier', value: 'premium', extra: {} },
          ],
        },
      },
    });
    // Act
    const result = validate(document);
    // Assess
    expect(result).toEqual(documentWith());
  });

  it('rejects inherited defaults instead of treating them as present', () => {
    // Prepare
    const flag = Object.create({ default: false });
    // Act
    const act = () => validate({ checkout: flag });
    // Assess
    expect(act).toThrow(SchemaValidationError);
  });
});

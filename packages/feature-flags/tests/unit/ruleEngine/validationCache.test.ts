import { afterEach, describe, expect, it, vi } from 'vitest';
import { SchemaValidationError } from '../../../src/errors.js';
import { evaluate } from '../../../src/ruleEngine/evaluate.js';
import * as validation from '../../../src/ruleEngine/validate.js';
import { createValidationCache } from '../../../src/ruleEngine/validationCache.js';
import type { EvaluationContext } from '../../../src/types/index.js';
import type { DocumentValidator } from '../../../src/types/RuleEngine.js';

/** Creates fresh equivalent documents with both rules and structured defaults. */
const createDocument = () => ({
  checkout: {
    default: false,
    rules: {
      premium: {
        when_match: true,
        conditions: [{ action: 'EQUALS', key: 'tier', value: 'premium' }],
      },
    },
  },
  banner: { boolean_type: false, default: { labels: ['public'] } },
});

/** Creates isolated spies without replacing the validator's implementation. */
const prepare = () => {
  const document = createDocument();
  const validate = vi.spyOn(validation, 'validate');
  const validateDocument = createValidationCache();
  return { document, validate, validateDocument };
};

/** Evaluates compiled definitions to preserve result assertions without a Store or retrieval. */
const validateAndEvaluate = async (
  validateDocument: DocumentValidator,
  document: unknown,
  context: EvaluationContext = {}
) => {
  const compiled = validateDocument(document);
  return Object.fromEntries(
    Object.entries(compiled).map(([name, flag]) => [
      name,
      evaluate(name, flag, { context }),
    ])
  );
};

describe('Rule Engine validation cache', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('reuses validation for equivalent fresh objects', async () => {
    // Prepare
    const { document, validate, validateDocument } = prepare();
    const equivalent = createDocument();
    // Act
    const first = await validateAndEvaluate(validateDocument, document, {
      tier: 'premium',
    });
    const compiled = validateDocument(document);
    const second = await validateAndEvaluate(validateDocument, equivalent, {
      tier: 'standard',
    });
    // Assess
    expect(equivalent).not.toBe(document);
    expect(validate).toHaveBeenCalledTimes(1);
    expect(first.checkout).toEqual({ found: true, value: true, enabled: true });
    expect(second.checkout).toEqual({
      found: true,
      value: false,
      enabled: false,
    });
    expect(validateDocument(equivalent)).toBe(compiled);
    expect(compiled).not.toBeInstanceOf(Promise);
  });

  it('revalidates an in-place source mutation', async () => {
    // Prepare
    const { document, validate, validateDocument } = prepare();
    // Act
    const first = await validateAndEvaluate(validateDocument, document, {
      tier: 'premium',
    });
    document.checkout.rules.premium.conditions[0].value = 'standard';
    const second = await validateAndEvaluate(validateDocument, document, {
      tier: 'premium',
    });
    // Assess
    expect(validate).toHaveBeenCalledTimes(2);
    expect(first.checkout).toEqual({ found: true, value: true, enabled: true });
    expect(second.checkout).toEqual({
      found: true,
      value: false,
      enabled: false,
    });
  });

  it('revalidates reordered rules and uses their new priority', async () => {
    // Prepare
    const firstRule = {
      when_match: 'first',
      conditions: [{ action: 'EQUALS', key: 'tier', value: 'premium' }],
    };
    const secondRule = { ...firstRule, when_match: 'second' };
    const validate = vi.spyOn(validation, 'validate');
    const validateDocument = createValidationCache();
    // Act
    const first = await validateAndEvaluate(
      validateDocument,
      {
        banner: {
          boolean_type: false,
          default: 'none',
          rules: { first: firstRule, second: secondRule },
        },
      },
      { tier: 'premium' }
    );
    const second = await validateAndEvaluate(
      validateDocument,
      {
        banner: {
          boolean_type: false,
          default: 'none',
          rules: { second: secondRule, first: firstRule },
        },
      },
      { tier: 'premium' }
    );
    // Assess
    expect(validate).toHaveBeenCalledTimes(2);
    expect(first.banner).toEqual({
      found: true,
      value: 'first',
      enabled: true,
    });
    expect(second.banner).toEqual({
      found: true,
      value: 'second',
      enabled: true,
    });
  });

  it('throws for an invalid replacement and preserves the last valid document', async () => {
    // Prepare
    const { document, validate, validateDocument } = prepare();
    // Act
    const first = await validateAndEvaluate(validateDocument, document);
    const invalid = validateAndEvaluate(validateDocument, {
      checkout: { default: 'invalid' },
    });
    // Assess
    await expect(invalid).rejects.toBeInstanceOf(SchemaValidationError);
    expect(validate).toHaveBeenCalledTimes(2);
    const unchanged = await validateAndEvaluate(
      validateDocument,
      createDocument()
    );
    expect(unchanged.checkout).toEqual(first.checkout);
    expect(validate).toHaveBeenCalledTimes(2);
    const changed = await validateAndEvaluate(validateDocument, {
      checkout: { default: true },
    });
    expect(changed.checkout).toEqual({
      found: true,
      value: true,
      enabled: true,
    });
    expect(validate).toHaveBeenCalledTimes(3);
  });

  it.each([
    { name: 'undefined array element', valid: [null], invalid: [undefined] },
    { name: 'NaN array element', valid: [null], invalid: [Number.NaN] },
    { name: 'NaN default', valid: null, invalid: Number.NaN },
    {
      name: 'omitted undefined property',
      valid: {},
      invalid: { label: undefined },
    },
    { name: 'infinite number', valid: null, invalid: Number.POSITIVE_INFINITY },
    { name: 'omitted function', valid: {}, invalid: { label: () => 'secret' } },
    { name: 'omitted symbol', valid: {}, invalid: { label: Symbol('secret') } },
    {
      name: 'Date conversion',
      valid: '2026-01-01T00:00:00.000Z',
      invalid: new Date('2026-01-01T00:00:00.000Z'),
    },
  ])(
    'rejects a serialization collision for $name',
    async ({ valid, invalid }) => {
      // Prepare
      const validDocument = { banner: { boolean_type: false, default: valid } };
      const invalidDocument = {
        banner: { boolean_type: false, default: invalid },
      };
      const validateDocument = createValidationCache();
      // Act
      const first = await validateAndEvaluate(validateDocument, validDocument);
      const invalidResult = validateAndEvaluate(
        validateDocument,
        invalidDocument
      );
      // Assess
      expect(JSON.stringify(invalidDocument)).toBe(
        JSON.stringify(validDocument)
      );
      await expect(invalidResult).rejects.toBeInstanceOf(SchemaValidationError);
      expect(
        await validateAndEvaluate(validateDocument, validDocument)
      ).toEqual(first);
    }
  );

  it.each(['cycle', 'BigInt'])(
    'rejects %s with a schema error rather than a serialization error',
    async (kind) => {
      // Prepare
      const value: Record<string, unknown> = { secret: 'secret-payload' };
      value.invalid = kind === 'cycle' ? value : 1n;
      const { document, validateDocument } = prepare();
      // Act
      await validateAndEvaluate(validateDocument, document);
      const result = validateAndEvaluate(validateDocument, {
        banner: { boolean_type: false, default: value },
      });
      // Assess
      await expect(result).rejects.toBeInstanceOf(SchemaValidationError);
      await expect(result).rejects.not.toThrow('secret-payload');
    }
  );

  it('rejects inherited serializers that hide invalid document fields', async () => {
    // Prepare
    const { document, validateDocument } = prepare();
    const invalid = Object.create({ toJSON: () => document });
    invalid.checkout = {};
    // Act
    await validateAndEvaluate(validateDocument, document);
    const result = validateAndEvaluate(validateDocument, invalid);
    // Assess
    expect(JSON.stringify(invalid)).toBe(JSON.stringify(document));
    await expect(result).rejects.toBeInstanceOf(SchemaValidationError);
  });

  it('accepts ordinary JSON properties named toJSON', async () => {
    // Prepare
    const value = { toJSON: 'ordinary property' };
    const validateDocument = createValidationCache();
    // Act
    const result = await validateAndEvaluate(validateDocument, {
      banner: { boolean_type: false, default: value },
    });
    // Assess
    expect(result.banner).toEqual({ found: true, value, enabled: true });
  });

  it('owns compiled values independently of later source mutations', async () => {
    // Prepare
    const { document, validate, validateDocument } = prepare();
    const unchanged = createDocument();
    const original = structuredClone(document);
    // Act
    const compiled = validateDocument(document);
    document.banner.default.labels.push('mutated');
    document.checkout.rules.premium.when_match = false;
    document.checkout.rules.premium.conditions[0].value = 'standard';
    const result = await validateAndEvaluate(validateDocument, unchanged, {
      tier: 'premium',
    });
    // Assess
    expect(validate).toHaveBeenCalledTimes(1);
    expect(result).toEqual({
      checkout: { found: true, value: true, enabled: true },
      banner: { found: true, value: original.banner.default, enabled: true },
    });
    expect(unchanged).toEqual(original);
    expect(compiled.banner.default).toEqual(original.banner.default);
    expect(compiled.checkout.rules.premium.conditions[0].value).toBe('premium');
  });

  it('never mutates source data during validation or evaluation', async () => {
    // Prepare
    const { document, validateDocument } = prepare();
    const original = structuredClone(document);
    // Act
    await validateAndEvaluate(validateDocument, document, { tier: 'premium' });
    await validateAndEvaluate(validateDocument, document);
    // Assess
    expect(document).toEqual(original);
  });

  it('keeps only the latest validated document', async () => {
    // Prepare
    const { document, validate, validateDocument } = prepare();
    // Act
    await validateAndEvaluate(validateDocument, document);
    await validateAndEvaluate(validateDocument, {
      checkout: { default: true },
    });
    const restored = await validateAndEvaluate(validateDocument, document);
    // Assess
    expect(validate).toHaveBeenCalledTimes(3);
    expect(restored.checkout).toEqual({
      found: true,
      value: false,
      enabled: false,
    });
  });

  it('validates many unchanged flags exactly once across repeated evaluations', async () => {
    // Prepare
    const { validate, validateDocument } = prepare();
    const document = Object.fromEntries(
      Array.from({ length: 100 }, (_, index) => [
        `flag_${index}`,
        createDocument().checkout,
      ])
    );
    // Act
    for (let index = 0; index < 20; index++) {
      const tier = index % 2 === 0 ? 'premium' : 'standard';
      const result = await validateAndEvaluate(validateDocument, document, {
        tier,
      });
      // Assess
      expect(Object.keys(result)).toHaveLength(100);
      expect(Object.values(result)).toEqual(
        Array.from({ length: 100 }, () => ({
          found: true,
          value: tier === 'premium',
          enabled: tier === 'premium',
        }))
      );
    }
    expect(validate).toHaveBeenCalledTimes(1);
  });
});

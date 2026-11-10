import type { JSONValue } from '@aws-lambda-powertools/commons/types';
import { afterEach, assert, describe, expect, it, vi } from 'vitest';
import { ruleEngineStore, SchemaValidationError } from '../../../src/index.js';
import * as validation from '../../../src/ruleEngine/validate.js';

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
  const source = vi.fn<() => Promise<JSONValue>>().mockResolvedValue(document);
  const validate = vi.spyOn(validation, 'validate');
  const store = ruleEngineStore({ source });
  return { document, source, validate, store };
};

describe('Rule Engine validation cache', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('reuses validation for equivalent fresh objects', async () => {
    // Prepare
    const { store, source, document, validate } = prepare();
    const equivalent = createDocument();
    source.mockResolvedValueOnce(document).mockResolvedValueOnce(equivalent);
    // Act
    const first = await store.getMany(['checkout'], { tier: 'premium' });
    const second = await store.getAll({ tier: 'standard' });
    // Assess
    expect(equivalent).not.toBe(document);
    expect(validate).toHaveBeenCalledTimes(1);
    expect(first.checkout).toEqual({ found: true, value: true, enabled: true });
    expect(second.checkout).toEqual({
      found: true,
      value: false,
      enabled: false,
    });
    expect(source).toHaveBeenCalledTimes(2);
  });

  it('revalidates an in-place source mutation', async () => {
    // Prepare
    const { store, document, validate } = prepare();
    // Act
    const first = await store.getAll({ tier: 'premium' });
    document.checkout.rules.premium.conditions[0].value = 'standard';
    const second = await store.getMany(['checkout'], { tier: 'premium' });
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
    const source = vi
      .fn<() => Promise<JSONValue>>()
      .mockResolvedValueOnce({
        banner: {
          boolean_type: false,
          default: 'none',
          rules: { first: firstRule, second: secondRule },
        },
      })
      .mockResolvedValueOnce({
        banner: {
          boolean_type: false,
          default: 'none',
          rules: { second: secondRule, first: firstRule },
        },
      });
    const validate = vi.spyOn(validation, 'validate');
    const store = ruleEngineStore({ source });
    // Act
    const first = await store.getAll({ tier: 'premium' });
    const second = await store.getAll({ tier: 'premium' });
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

  it.each(['getMany', 'getAll'] as const)(
    'throws for an invalid replacement in %s and preserves the last valid snapshot',
    async (method) => {
      // Prepare
      const { store, source, document, validate } = prepare();
      source
        .mockResolvedValueOnce(document)
        .mockResolvedValueOnce({ checkout: { default: 'invalid' } })
        .mockResolvedValueOnce(createDocument())
        .mockResolvedValueOnce({ checkout: { default: true } });
      // Act
      const first = await store.getAll({});
      const invalid =
        method === 'getMany'
          ? store.getMany(['checkout'], {})
          : store.getAll({});
      // Assess
      await expect(invalid).rejects.toBeInstanceOf(SchemaValidationError);
      expect(validate).toHaveBeenCalledTimes(2);
      const unchanged = await store.getMany(['checkout'], {});
      expect(unchanged.checkout).toEqual(first.checkout);
      expect(validate).toHaveBeenCalledTimes(2);
      const changed = await store.getAll({});
      expect(changed.checkout).toEqual({
        found: true,
        value: true,
        enabled: true,
      });
      expect(validate).toHaveBeenCalledTimes(3);
    }
  );

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
      const source = vi
        .fn<() => Promise<JSONValue>>()
        .mockResolvedValueOnce(validDocument);
      // Exercise JavaScript callers that bypass the source's JSONValue contract.
      // @ts-expect-error Deliberately return a non-JSON document at the source boundary.
      source.mockResolvedValueOnce(invalidDocument);
      source.mockResolvedValueOnce(validDocument);
      const store = ruleEngineStore({ source });
      // Act
      const first = await store.getAll({});
      const invalidResult = store.getMany(['banner'], {});
      // Assess
      expect(JSON.stringify(invalidDocument)).toBe(
        JSON.stringify(validDocument)
      );
      await expect(invalidResult).rejects.toBeInstanceOf(SchemaValidationError);
      expect(await store.getAll({})).toEqual(first);
    }
  );

  it.each(['cycle', 'BigInt'])(
    'rejects %s with a schema error rather than a serialization error',
    async (kind) => {
      // Prepare
      const value: Record<string, unknown> = { secret: 'secret-payload' };
      value.invalid = kind === 'cycle' ? value : 1n;
      const { store, source, document } = prepare();
      source.mockResolvedValueOnce(document);
      // @ts-expect-error Deliberately return a non-JSON document at the source boundary.
      source.mockResolvedValueOnce({
        banner: { boolean_type: false, default: value },
      });
      // Act
      await store.getAll({});
      const result = store.getAll({});
      // Assess
      await expect(result).rejects.toBeInstanceOf(SchemaValidationError);
      await expect(result).rejects.not.toThrow('secret-payload');
    }
  );

  it('rejects inherited serializers that hide invalid document fields', async () => {
    // Prepare
    const { store, source, document } = prepare();
    const invalid = Object.create({ toJSON: () => document });
    invalid.checkout = {};
    source.mockResolvedValueOnce(document).mockResolvedValueOnce(invalid);
    // Act
    await store.getAll({});
    const result = store.getAll({});
    // Assess
    expect(JSON.stringify(invalid)).toBe(JSON.stringify(document));
    await expect(result).rejects.toBeInstanceOf(SchemaValidationError);
  });

  it('accepts ordinary JSON properties named toJSON', async () => {
    // Prepare
    const value = { toJSON: 'ordinary property' };
    const store = ruleEngineStore({
      source: async () => ({ banner: { boolean_type: false, default: value } }),
    });
    // Act
    const result = await store.getAll({});
    // Assess
    expect(result.banner).toEqual({ found: true, value, enabled: true });
  });

  it.each(['getMany', 'getAll'] as const)(
    'captures one document for overlapping %s and getAll calls',
    async (method) => {
      // Prepare
      const firstSource = Promise.withResolvers<JSONValue>();
      const secondSource = Promise.withResolvers<JSONValue>();
      const source = vi
        .fn<() => Promise<JSONValue>>()
        .mockReturnValueOnce(firstSource.promise)
        .mockReturnValueOnce(secondSource.promise);
      const validate = vi.spyOn(validation, 'validate');
      const logger = {
        debug: vi.fn(),
        warn: vi.fn(),
        info: vi.fn(),
        error: vi.fn(),
      };
      const store = ruleEngineStore({ source, logger });
      // Both retrieval continuations install their snapshots before either evaluation resumes.
      logger.debug.mockImplementation(() => {
        expect(validate).toHaveBeenCalledTimes(2);
      });
      // Act
      const first =
        method === 'getMany'
          ? store.getMany(['checkout', 'banner'], {})
          : store.getAll({});
      const second = store.getAll({});
      firstSource.resolve({
        checkout: { default: true },
        banner: { default: true },
      });
      secondSource.resolve({
        checkout: { default: false },
        banner: { default: false },
      });
      const [firstResult, secondResult] = await Promise.all([first, second]);
      // Assess
      expect(firstResult).toEqual({
        checkout: { found: true, value: true, enabled: true },
        banner: { found: true, value: true, enabled: true },
      });
      expect(secondResult).toEqual({
        checkout: { found: true, value: false, enabled: false },
        banner: { found: true, value: false, enabled: false },
      });
      expect(logger.debug).toHaveBeenCalledTimes(4);
      expect(source).toHaveBeenCalledTimes(2);
    }
  );

  it.each([
    { selection: 'default', value: { nested: ['original'] } },
    { selection: 'default', value: [{ nested: ['original'] }] },
    { selection: 'rule', value: { nested: ['original'] } },
    { selection: 'rule', value: [{ nested: ['original'] }] },
  ])(
    'isolates returned $selection value $value',
    async ({ selection, value }) => {
      // Prepare
      const document = {
        banner: {
          boolean_type: false,
          default: value,
          rules: {
            premium: {
              when_match: value,
              conditions: [{ action: 'EQUALS', key: 'tier', value: 'premium' }],
            },
          },
        },
      };
      const context = { tier: selection === 'rule' ? 'premium' : 'standard' };
      const store = ruleEngineStore({ source: async () => document });
      const validate = vi.spyOn(validation, 'validate');
      const original = structuredClone(value);
      // Act
      const first = await store.getMany(['banner'], context);
      assert(first.banner.found);
      const returned = first.banner.value;
      const container = Array.isArray(returned) ? returned[0] : returned;
      assert(
        typeof container === 'object' &&
          container !== null &&
          !Array.isArray(container)
      );
      assert(Array.isArray(container.nested));
      container.nested.push('mutated');
      if (Array.isArray(returned)) returned.push('mutated');
      const second = await store.getAll(context);
      // Assess
      expect(second.banner).toEqual({
        found: true,
        value: original,
        enabled: true,
      });
      expect(value).toEqual(original);
      expect(validate).toHaveBeenCalledTimes(1);
    }
  );

  it('owns snapshot values independently of later source mutations', async () => {
    // Prepare
    const { store, source, document, validate } = prepare();
    const unchanged = createDocument();
    const original = structuredClone(document);
    // Act
    await store.getAll({});
    document.banner.default.labels.push('mutated');
    document.checkout.rules.premium.when_match = false;
    document.checkout.rules.premium.conditions[0].value = 'standard';
    source.mockResolvedValueOnce(unchanged);
    const result = await store.getAll({ tier: 'premium' });
    // Assess
    expect(validate).toHaveBeenCalledTimes(1);
    expect(result).toEqual({
      checkout: { found: true, value: true, enabled: true },
      banner: { found: true, value: original.banner.default, enabled: true },
    });
    expect(unchanged).toEqual(original);
  });

  it('never mutates source data during validation or evaluation', async () => {
    // Prepare
    const { store, document } = prepare();
    const original = structuredClone(document);
    // Act
    await store.getMany(['checkout', 'banner'], { tier: 'premium' });
    await store.getAll({});
    // Assess
    expect(document).toEqual(original);
  });

  it('keeps only the latest validated snapshot', async () => {
    // Prepare
    const { store, source, document, validate } = prepare();
    source
      .mockResolvedValueOnce(document)
      .mockResolvedValueOnce({ checkout: { default: true } })
      .mockResolvedValueOnce(document);
    // Act
    await store.getAll({});
    await store.getAll({});
    const restored = await store.getAll({});
    // Assess
    expect(validate).toHaveBeenCalledTimes(3);
    expect(restored.checkout).toEqual({
      found: true,
      value: false,
      enabled: false,
    });
  });

  it('isolates caches between store instances', async () => {
    // Prepare
    const { store, source, validate } = prepare();
    const other = ruleEngineStore({ source });
    // Act
    await store.getAll({});
    await other.getAll({});
    await store.getAll({});
    await other.getAll({});
    // Assess
    expect(validate).toHaveBeenCalledTimes(2);
    expect(source).toHaveBeenCalledTimes(4);
  });

  it('validates many unchanged flags exactly once across repeated evaluations', async () => {
    // Prepare
    const { store, source, validate } = prepare();
    const document = Object.fromEntries(
      Array.from({ length: 100 }, (_, index) => [
        `flag_${index}`,
        createDocument().checkout,
      ])
    );
    source.mockResolvedValue(document);
    // Act
    for (let index = 0; index < 20; index++) {
      const tier = index % 2 === 0 ? 'premium' : 'standard';
      const result =
        index % 2 === 0
          ? await store.getAll({ tier })
          : await store.getMany(Object.keys(document), { tier });
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
    expect(source).toHaveBeenCalledTimes(20);
  });
});

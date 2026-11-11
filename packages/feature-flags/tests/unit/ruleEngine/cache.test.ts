import type { JSONValue } from '@aws-lambda-powertools/commons/types';
import { afterEach, assert, describe, expect, it, vi } from 'vitest';
import { ruleEngineStore } from '../../../src/index.js';
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

describe('Rule Engine store cache wiring', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('retrieves the source on each call with equivalent document content', async () => {
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
      // Resolve the first retrieval only after the second call has installed and evaluated its document.
      let firstEvaluation = false;
      logger.debug.mockImplementation(() => {
        if (firstEvaluation) {
          expect(validate).toHaveBeenCalledTimes(2);
        } else {
          expect(validate).toHaveBeenCalledTimes(1);
        }
      });
      // Act
      const first =
        method === 'getMany'
          ? store.getMany(['checkout', 'banner'], {})
          : store.getAll({});
      const second = store.getAll({});
      secondSource.resolve({
        checkout: { default: false },
        banner: { default: false },
      });
      await second;
      firstEvaluation = true;
      firstSource.resolve({
        checkout: { default: true },
        banner: { default: true },
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

  it.each([
    { reason: 'empty-document', document: {}, name: undefined },
    {
      reason: 'empty-rules',
      document: { checkout: { default: false, rules: {} } },
      name: 'checkout',
    },
  ])(
    'warns about $reason once per new content',
    async ({ reason, document, name }) => {
      // Prepare
      const source = vi
        .fn<() => Promise<JSONValue>>()
        .mockResolvedValueOnce(document)
        .mockResolvedValueOnce(structuredClone(document))
        .mockResolvedValueOnce({ checkout: { default: true } })
        .mockResolvedValueOnce(document)
        .mockResolvedValueOnce(structuredClone(document));
      const logger = {
        debug: vi.fn(),
        warn: vi.fn(),
        info: vi.fn(),
        error: vi.fn(),
      };
      const store = ruleEngineStore({ source, logger });
      const warning =
        name === undefined
          ? { store: 'rule-engine', reason }
          : { store: 'rule-engine', reason, name };
      // Act
      await store.getMany(['checkout'], {});
      await store.getAll({});
      await store.getAll({});
      await store.getMany(['checkout'], {});
      await store.getAll({});
      // Assess
      expect(logger.warn.mock.calls).toEqual([[warning], [warning]]);
      expect(source).toHaveBeenCalledTimes(5);
    }
  );

  it('retrieves every batch without caching context-dependent results', async () => {
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

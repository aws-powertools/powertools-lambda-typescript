import type { JSONValue } from '@aws-lambda-powertools/commons/types';
import { describe, expect, it, vi } from 'vitest';
import {
  ConditionEvaluationError,
  FeatureFlags,
  ruleEngineStore,
  SchemaValidationError,
  StoreUnavailableError,
} from '../../../src/index.js';

/** Creates isolated retrieval and logging fixtures. */
const prepare = () => {
  const document = {
    checkout: {
      default: false,
      rules: {
        premium: {
          when_match: true,
          conditions: [
            { action: 'EQUALS', key: 'tier', value: 'secret-premium' },
          ],
        },
      },
    },
    banner: { boolean_type: false, default: 'secret-banner' },
  };
  const source = vi.fn<() => Promise<JSONValue>>().mockResolvedValue(document);
  const logger = {
    debug: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
    error: vi.fn(),
  };
  const store = ruleEngineStore({ source, logger });
  return { document, source, logger, store };
};

describe('ruleEngineStore', () => {
  it('returns known and missing flags from one retrieval', async () => {
    // Prepare
    const { store, source } = prepare();
    // Act
    const result = await store.getMany(['missing', 'checkout', 'banner'], {
      tier: 'secret-premium',
    });
    // Assess
    expect(store.name).toBe('rule-engine');
    expect(result).toEqual({
      missing: { found: false },
      checkout: { found: true, value: true, enabled: true },
      banner: { found: true, value: 'secret-banner', enabled: true },
    });
    expect(source).toHaveBeenCalledExactlyOnceWith();
  });

  it('evaluates every flag from one retrieval for getAll', async () => {
    // Prepare
    const { store, source } = prepare();
    // Act
    const result = await store.getAll({ tier: 'standard' });
    // Assess
    expect(result).toEqual({
      checkout: { found: true, value: false, enabled: false },
      banner: { found: true, value: 'secret-banner', enabled: true },
    });
    expect(source).toHaveBeenCalledExactlyOnceWith();
  });

  it('evaluates a repeated requested name only once', async () => {
    // Prepare
    const { store, logger, source } = prepare();
    // Act
    const result = await store.getMany(['checkout', 'checkout'], {
      tier: 'secret-premium',
    });
    // Assess
    expect(result).toEqual({
      checkout: { found: true, value: true, enabled: true },
    });
    expect(source).toHaveBeenCalledExactlyOnceWith();
    expect(logger.debug).toHaveBeenCalledExactlyOnceWith({
      store: 'rule-engine',
      name: 'checkout',
      outcome: 'rule',
      rule: 'premium',
    });
  });

  it('retrieves and validates the whole document for an empty request', async () => {
    // Prepare
    const { store, source, logger } = prepare();
    // Act
    const result = await store.getMany([], {});
    // Assess
    expect(result).toEqual({});
    expect(source).toHaveBeenCalledExactlyOnceWith();
    expect(logger.debug).not.toHaveBeenCalled();
  });

  it.each(['getMany', 'getAll'] as const)(
    'propagates source rejection unchanged for %s',
    async (method) => {
      // Prepare
      const { store, source, logger } = prepare();
      const error = new Error('secret-source-error');
      source.mockRejectedValue(error);
      // Act
      const result =
        method === 'getMany'
          ? store.getMany(['checkout'], {})
          : store.getAll({});
      // Assess
      await expect(result).rejects.toBe(error);
      expect(logger.warn).not.toHaveBeenCalled();
      expect(logger.debug).not.toHaveBeenCalled();
    }
  );

  it('preserves the source availability error category', async () => {
    // Prepare
    const { source, store } = prepare();
    const error = new StoreUnavailableError('Unavailable');
    source.mockRejectedValue(error);
    // Act
    const result = store.getAll({});
    // Assess
    await expect(result).rejects.toBe(error);
  });

  it.each(['getMany', 'getAll'] as const)(
    'rejects non-object source results for %s',
    async (method) => {
      // Prepare
      const { store, source } = prepare();
      source.mockResolvedValue('secret-document');
      // Act
      const result =
        method === 'getMany'
          ? store.getMany(['checkout'], {})
          : store.getAll({});
      // Assess
      await expect(result).rejects.toBeInstanceOf(SchemaValidationError);
      await expect(result).rejects.not.toThrow('secret-document');
    }
  );

  it('validates unrequested flags instead of returning a partial result', async () => {
    // Prepare
    const { store, source } = prepare();
    source.mockResolvedValue({
      checkout: { default: true },
      broken: { default: 'secret-invalid' },
    });
    // Act
    const result = store.getMany(['checkout'], {});
    // Assess
    await expect(result).rejects.toBeInstanceOf(SchemaValidationError);
    await expect(result).rejects.toThrow(
      "Flag 'broken' default must be a boolean"
    );
    await expect(result).rejects.not.toThrow('secret-invalid');
  });

  it('revalidates the same source object on every call', async () => {
    // Prepare
    const document: Record<string, JSONValue> = { checkout: { default: true } };
    const source = vi
      .fn<() => Promise<JSONValue>>()
      .mockResolvedValue(document);
    const store = ruleEngineStore({ source });
    // Act
    const first = await store.getMany(['checkout'], {});
    document.checkout = { default: 'secret-invalid' };
    const second = store.getAll({});
    // Assess
    expect(first).toEqual({
      checkout: { found: true, value: true, enabled: true },
    });
    await expect(second).rejects.toBeInstanceOf(SchemaValidationError);
    expect(source).toHaveBeenCalledTimes(2);
  });

  it('warns again for an empty document on every retrieval', async () => {
    // Prepare
    const { store, source, logger } = prepare();
    source.mockResolvedValue({});
    // Act
    await store.getMany(['checkout'], {});
    await store.getAll({});
    // Assess
    expect(source).toHaveBeenCalledTimes(2);
    expect(logger.warn.mock.calls).toEqual([
      [{ store: 'rule-engine', reason: 'empty-document' }],
      [{ store: 'rule-engine', reason: 'empty-document' }],
    ]);
  });

  it('isolates concurrent calls with different retrieved documents', async () => {
    // Prepare
    const { store, source } = prepare();
    let resolveFirst: (document: JSONValue) => void = () => {};
    source.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          resolveFirst = resolve;
        })
    );
    source.mockResolvedValueOnce({ checkout: { default: false } });
    // Act
    const first = store.getMany(['checkout'], {});
    const second = await store.getAll({});
    resolveFirst({ checkout: { default: true } });
    const firstResult = await first;
    // Assess
    expect(firstResult).toEqual({
      checkout: { found: true, value: true, enabled: true },
    });
    expect(second).toEqual({
      checkout: { found: true, value: false, enabled: false },
    });
    expect(source).toHaveBeenCalledTimes(2);
  });

  it('logs an exact private Rule outcome', async () => {
    // Prepare
    const { store, logger } = prepare();
    // Act
    await store.getMany(['checkout'], { tier: 'secret-premium' });
    // Assess
    expect(logger.debug).toHaveBeenCalledExactlyOnceWith({
      store: 'rule-engine',
      name: 'checkout',
      outcome: 'rule',
      rule: 'premium',
    });
    expect(logger.warn).not.toHaveBeenCalled();
  });

  it('logs an exact private Flag Default outcome', async () => {
    // Prepare
    const { store, logger } = prepare();
    // Act
    await store.getMany(['banner'], { secret: 'secret-context' });
    // Assess
    expect(logger.debug).toHaveBeenCalledExactlyOnceWith({
      store: 'rule-engine',
      name: 'banner',
      outcome: 'default',
    });
    expect(logger.warn).not.toHaveBeenCalled();
  });

  it('does not log unknown flags as evaluated flags', async () => {
    // Prepare
    const { store, logger } = prepare();
    // Act
    await store.getMany(['unknown'], { secret: 'secret-context' });
    // Assess
    expect(logger.debug).not.toHaveBeenCalled();
    expect(logger.warn).not.toHaveBeenCalled();
  });

  it('warns about empty rules with an exact private payload', async () => {
    // Prepare
    const { store, source, logger } = prepare();
    source.mockResolvedValue({ checkout: { default: false, rules: {} } });
    // Act
    await store.getAll({ secret: 'secret-context' });
    // Assess
    expect(logger.warn).toHaveBeenCalledExactlyOnceWith({
      store: 'rule-engine',
      reason: 'empty-rules',
      name: 'checkout',
    });
    expect(logger.debug).toHaveBeenCalledExactlyOnceWith({
      store: 'rule-engine',
      name: 'checkout',
      outcome: 'default',
    });
  });

  it('warns for each flag with empty rules even outside the requested subset', async () => {
    // Prepare
    const { store, source, logger } = prepare();
    source.mockResolvedValue({
      checkout: { default: false, rules: {} },
      banner: { default: true, rules: {} },
    });
    // Act
    await store.getMany(['unknown'], {});
    // Assess
    expect(logger.warn.mock.calls).toEqual([
      [{ store: 'rule-engine', reason: 'empty-rules', name: 'checkout' }],
      [{ store: 'rule-engine', reason: 'empty-rules', name: 'banner' }],
    ]);
  });

  it.each<JSONValue>([
    {},
    { checkout: { default: false, rules: {} } },
    {
      checkout: {
        default: false,
        rules: {
          premium: {
            when_match: true,
            conditions: [
              { action: 'EQUALS', key: 'tier', value: 'secret-premium' },
            ],
          },
        },
      },
    },
  ])('emits nothing without a logger for document %j', async (document) => {
    // Prepare
    const store = ruleEngineStore({ source: async () => document });
    // Act
    await store.getMany(['checkout', 'unknown'], { tier: 'secret-premium' });
    await store.getAll({});
    // Assess
    expect(console.debug).not.toHaveBeenCalled();
    expect(console.warn).not.toHaveBeenCalled();
    expect(console.info).not.toHaveBeenCalled();
    expect(console.error).not.toHaveBeenCalled();
  });

  it('propagates incompatible operand errors without logging values', async () => {
    // Prepare
    const { store, source, logger } = prepare();
    source.mockResolvedValue({
      checkout: {
        default: false,
        rules: {
          premium: {
            when_match: true,
            conditions: [{ action: 'STARTSWITH', key: 'tier', value: 123456 }],
          },
        },
      },
    });
    // Act
    const result = store.getMany(['checkout'], { tier: 'secret-context' });
    // Assess
    await expect(result).rejects.toBeInstanceOf(ConditionEvaluationError);
    await expect(result).rejects.toThrow(
      "Flag 'checkout', rule 'premium', key 'tier', action 'STARTSWITH': incompatible operands"
    );
    await expect(result).rejects.not.toThrow(/secret-context|123456/);
    expect(logger.warn).not.toHaveBeenCalled();
    expect(logger.debug).not.toHaveBeenCalled();
  });

  it.each(['getMany', 'getAll'] as const)(
    'preserves special own flag and Rule names for %s',
    async (method) => {
      // Prepare
      const document = JSON.parse(
        '{"__proto__":{"default":false,"rules":{"__proto__":{"when_match":true,"conditions":[{"action":"EQUALS","key":"__proto__","value":"premium"}]}}},"constructor":{"default":true}}'
      );
      const context = JSON.parse('{"__proto__":"premium"}');
      const store = ruleEngineStore({ source: async () => document });
      // Act
      const result =
        method === 'getMany'
          ? await store.getMany(['__proto__', 'constructor'], context)
          : await store.getAll(context);
      // Assess
      expect(Object.keys(result)).toEqual(['__proto__', 'constructor']);
      expect(Object.getPrototypeOf(result)).toBe(Object.prototype);
      expect(
        Object.getOwnPropertyDescriptor(result, '__proto__')?.value
      ).toEqual({
        found: true,
        value: true,
        enabled: true,
      });
      expect(result.constructor).toEqual({
        found: true,
        value: true,
        enabled: true,
      });
    }
  );

  it('reports inherited object names as missing flags', async () => {
    // Prepare
    const store = ruleEngineStore({ source: async () => ({}) });
    // Act
    const result = await store.getMany(
      ['toString', 'constructor', '__proto__'],
      {}
    );
    // Assess
    expect(Object.keys(result)).toEqual([
      'toString',
      'constructor',
      '__proto__',
    ]);
    expect(Object.values(result)).toEqual([
      { found: false },
      { found: false },
      { found: false },
    ]);
  });

  it.each([
    { name: 'checkout', fallback: false, expected: true },
    { name: 'banner', fallback: '', expected: 'secret-banner' },
  ])(
    'integrates with FeatureFlags.evaluate for $name',
    async ({ name, fallback, expected }) => {
      // Prepare
      const { source } = prepare();
      const flags = new FeatureFlags({ store: ruleEngineStore({ source }) });
      // Act
      const result = await flags.evaluate({
        name,
        context: { tier: 'secret-premium' },
        default: fallback,
      });
      // Assess
      expect(result).toBe(expected);
      expect(source).toHaveBeenCalledExactlyOnceWith();
    }
  );
});

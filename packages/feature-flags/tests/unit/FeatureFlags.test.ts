import type { JSONValue } from '@aws-lambda-powertools/commons/types';
import { describe, expect, it, vi } from 'vitest';
import {
  type EvaluationContext,
  FeatureFlags,
  FlagValueTypeError,
  InvalidContextError,
  type Store,
  type StoreResult,
  StoreUnavailableError,
} from '../../src/index.js';

/** Creates an isolated in-memory Store and logger for each test. */
const prepare = () => {
  const store = {
    name: 'in-memory',
    getMany: vi.fn<Store['getMany']>(),
    getAll: vi.fn<Store['getAll']>(),
  };
  const logger = {
    debug: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
    error: vi.fn(),
  };
  const flags = new FeatureFlags({ store, logger });
  return { store, logger, flags };
};

describe('FeatureFlags', () => {
  it('preserves special names and numeric key order in batch results', async () => {
    // Prepare
    const { flags, store } = prepare();
    const fallbacks = { z: false, ['__proto__']: 'fallback', 2: 10, 1: 20 };
    store.getMany.mockResolvedValue({
      ['__proto__']: { found: true, value: 'stored', enabled: true },
    });
    // Act
    const result = await flags.evaluateMany({ flags: fallbacks });
    // Assess
    expect(result).toEqual({ ...fallbacks, ['__proto__']: 'stored' });
    expect(Object.keys(result)).toEqual(Object.keys(fallbacks));
    expect(store.getMany).toHaveBeenCalledExactlyOnceWith(
      ['1', '2', 'z', '__proto__'],
      {}
    );
  });

  it.each(['found', 'partial', 'fallback'] as const)(
    'evaluates a batch with outcome $0',
    async (outcome) => {
      // Prepare
      const { flags, store, logger } = prepare();
      const fallbacks = { a: false, b: 10, c: 'x', d: { k: 1 } };
      const context = { secret: 'hidden', facts: [true, 1, 'x'] };
      store.getMany.mockResolvedValue({
        ...(outcome !== 'fallback'
          ? { a: { found: true as const, value: true, enabled: false } }
          : {}),
        ...(outcome === 'found'
          ? {
              b: { found: true as const, value: 20, enabled: true },
              c: { found: true as const, value: 'y', enabled: true },
              d: { found: true as const, value: { other: 2 }, enabled: true },
            }
          : { b: { found: false as const } }),
        extra: { found: true, value: 'ignored', enabled: true },
      });
      // Act
      const result = await flags.evaluateMany({ flags: fallbacks, context });
      // Assess
      expect(result).toEqual(
        outcome === 'found'
          ? { a: true, b: 20, c: 'y', d: { other: 2 } }
          : { ...fallbacks, a: outcome === 'partial' }
      );
      expect(Object.keys(result)).toEqual(Object.keys(fallbacks));
      expect(store.getMany).toHaveBeenCalledExactlyOnceWith(
        ['a', 'b', 'c', 'd'],
        context
      );
      expect(store.getAll).not.toHaveBeenCalled();
      expect(logger.debug).toHaveBeenCalledExactlyOnceWith({
        store: 'in-memory',
        outcome,
        names: ['a', 'b', 'c', 'd'],
      });
      if (outcome === 'found') expect(logger.warn).not.toHaveBeenCalled();
      else
        expect(logger.warn).toHaveBeenCalledExactlyOnceWith({
          store: 'in-memory',
          reason: 'missing',
          names: outcome === 'partial' ? ['b', 'c', 'd'] : ['a', 'b', 'c', 'd'],
        });
    }
  );

  it('returns every fallback for an unavailable batch', async () => {
    // Prepare
    const { flags, store, logger } = prepare();
    store.getMany.mockRejectedValue(new StoreUnavailableError('secret'));
    const fallbacks = { a: false, b: { secret: 'hidden' } };
    // Act
    const result = await flags.evaluateMany({ flags: fallbacks });
    // Assess
    expect(result).toEqual(fallbacks);
    expect(store.getMany).toHaveBeenCalledExactlyOnceWith(['a', 'b'], {});
    expect(logger.warn).toHaveBeenCalledExactlyOnceWith({
      store: 'in-memory',
      reason: 'unavailable',
      names: ['a', 'b'],
    });
    expect(logger.debug).toHaveBeenCalledExactlyOnceWith({
      store: 'in-memory',
      outcome: 'fallback',
      names: ['a', 'b'],
    });
  });

  it('rejects the whole batch for a mismatched flag', async () => {
    // Prepare
    const { flags, store, logger } = prepare();
    store.getMany.mockResolvedValue({
      b: { found: true, value: 'secret', enabled: true },
    });
    // Act
    const result = flags.evaluateMany({ flags: { a: false, b: 10 } });
    // Assess
    await expect(result).rejects.toBeInstanceOf(FlagValueTypeError);
    await expect(result).rejects.toThrow(
      "Flag 'b' expected type 'number' but received 'string'"
    );
    expect(store.getMany).toHaveBeenCalledExactlyOnceWith(['a', 'b'], {});
    expect(logger.debug).not.toHaveBeenCalled();
    expect(logger.warn).not.toHaveBeenCalled();
  });

  it.each([null, [], Number.NaN])(
    'accepts unchecked or numeric batch fallback %j',
    async (fallback) => {
      // Prepare
      const { flags, store } = prepare();
      const value = typeof fallback === 'number' ? Number.NaN : { k: 1 };
      store.getMany.mockResolvedValue({
        a: { found: true, value, enabled: false },
      });
      // Act
      const result = await flags.evaluateMany({ flags: { a: fallback } });
      // Assess
      expect(result).toEqual({ a: value });
    }
  );

  it('evaluates an empty batch with one Store call', async () => {
    // Prepare
    const { flags, store, logger } = prepare();
    store.getMany.mockResolvedValue({});
    // Act
    const result = await flags.evaluateMany({ flags: {} });
    // Assess
    expect(result).toEqual({});
    expect(store.getMany).toHaveBeenCalledExactlyOnceWith([], {});
    expect(logger.debug).toHaveBeenCalledExactlyOnceWith({
      store: 'in-memory',
      outcome: 'found',
      names: [],
    });
    expect(logger.warn).not.toHaveBeenCalled();
  });

  it.each([false, true])(
    'gets enabled names with empty response $0',
    async (empty) => {
      // Prepare
      const { flags, store, logger } = prepare();
      const context = { secret: 'hidden' };
      store.getAll.mockResolvedValue(
        empty
          ? {}
          : {
              z: { found: true, enabled: true, value: { k: 1 } },
              missing: { found: false },
              disabled: { found: true, enabled: false, value: true },
              a: { found: true, enabled: true, value: false },
            }
      );
      // Act
      const result = await flags.getEnabledFeatures({ context });
      // Assess
      expect(result).toEqual(empty ? [] : ['z', 'a']);
      expect(store.getAll).toHaveBeenCalledExactlyOnceWith(context);
      expect(store.getMany).not.toHaveBeenCalled();
      expect(logger.debug).toHaveBeenCalledExactlyOnceWith({
        store: 'in-memory',
        outcome: 'found',
        enabled: empty ? 0 : 2,
      });
      expect(logger.warn).not.toHaveBeenCalled();
    }
  );

  it('returns no enabled names for an unavailable Store', async () => {
    // Prepare
    const { flags, store, logger } = prepare();
    store.getAll.mockRejectedValue(new StoreUnavailableError('secret'));
    // Act
    const result = await flags.getEnabledFeatures();
    // Assess
    expect(result).toEqual([]);
    expect(store.getAll).toHaveBeenCalledExactlyOnceWith({});
    expect(logger.warn).toHaveBeenCalledExactlyOnceWith({
      store: 'in-memory',
      reason: 'unavailable',
    });
    expect(logger.debug).toHaveBeenCalledExactlyOnceWith({
      store: 'in-memory',
      outcome: 'fallback',
      enabled: 0,
    });
  });

  it.each(['evaluateMany', 'getEnabledFeatures'] as const)(
    'propagates errors from $0 unchanged',
    async (method) => {
      // Prepare
      const { flags, store, logger } = prepare();
      const error = new Error('secret');
      store.getMany.mockRejectedValue(error);
      store.getAll.mockRejectedValue(error);
      // Act
      const result =
        method === 'evaluateMany'
          ? flags.evaluateMany({ flags: { a: false } })
          : flags.getEnabledFeatures();
      // Assess
      await expect(result).rejects.toBe(error);
      expect(logger.debug).not.toHaveBeenCalled();
      expect(logger.warn).not.toHaveBeenCalled();
    }
  );

  it.each(['evaluateMany', 'getEnabledFeatures'] as const)(
    'validates context before $0 lookup',
    async (method) => {
      // Prepare
      const { flags, store } = prepare();
      const context: EvaluationContext = {
        // @ts-expect-error Test JavaScript callers that bypass context types.
        invalid: [null],
      };
      // Act
      const result =
        method === 'evaluateMany'
          ? flags.evaluateMany({ flags: { a: false }, context })
          : flags.getEnabledFeatures({ context });
      // Assess
      await expect(result).rejects.toBeInstanceOf(InvalidContextError);
      await expect(result).rejects.toThrow(
        "Invalid evaluation context key 'invalid': expected a string, number, boolean, or array of those, received an array containing null"
      );
      expect(store.getMany).not.toHaveBeenCalled();
      expect(store.getAll).not.toHaveBeenCalled();
    }
  );

  it.each(['found', 'missing', 'unavailable'] as const)(
    'keeps batch and enabled lookups silent without a logger for $0',
    async (outcome) => {
      // Prepare
      const { store } = prepare();
      const flags = new FeatureFlags({ store });
      if (outcome === 'unavailable') {
        store.getMany.mockRejectedValue(new StoreUnavailableError('secret'));
        store.getAll.mockRejectedValue(new StoreUnavailableError('secret'));
      } else {
        const response: Record<string, StoreResult> =
          outcome === 'found'
            ? { a: { found: true as const, value: true, enabled: true } }
            : {};
        store.getMany.mockResolvedValue(response);
        store.getAll.mockResolvedValue(response);
      }
      // Act
      await flags.evaluateMany({ flags: { a: false } });
      await flags.getEnabledFeatures({});
      // Assess
      expect(console.debug).not.toHaveBeenCalled();
      expect(console.warn).not.toHaveBeenCalled();
    }
  );

  it.each<{ fallback: JSONValue; value: JSONValue }>([
    { fallback: false, value: true },
    { fallback: 10, value: 20 },
    { fallback: 'x', value: 'y' },
    { fallback: { a: 1 }, value: { b: 2 } },
    { fallback: [], value: { b: 2 } },
    { fallback: null, value: [true] },
  ])(
    'returns the Store value for fallback $fallback',
    async ({ fallback, value }) => {
      // Prepare
      const { flags, store } = prepare();
      store.getMany.mockResolvedValue({
        checkout: { found: true, value, enabled: false },
      });
      // Act
      const result = await flags.evaluate({
        name: 'checkout',
        default: fallback,
      });
      // Assess
      expect(result).toBe(value);
    }
  );

  it.each<Record<string, StoreResult>>([{}, { checkout: { found: false } }])(
    'returns the fallback for a missing flag %j',
    async (response) => {
      // Prepare
      const { flags, store } = prepare();
      store.getMany.mockResolvedValue(response);
      // Act
      const result = await flags.evaluate({ name: 'checkout', default: false });
      // Assess
      expect(result).toBe(false);
    }
  );

  it('returns the fallback for an unavailable Store', async () => {
    // Prepare
    const { flags, store } = prepare();
    store.getMany.mockRejectedValue(new StoreUnavailableError('Unavailable'));
    // Act
    const result = await flags.evaluate({ name: 'checkout', default: false });
    // Assess
    expect(result).toBe(false);
  });

  it('propagates other errors unchanged', async () => {
    // Prepare
    const { flags, store, logger } = prepare();
    const error = new Error('Unexpected');
    store.getMany.mockRejectedValue(error);
    // Act
    const result = flags.evaluate({ name: 'checkout', default: false });
    // Assess
    await expect(result).rejects.toBe(error);
    expect(logger.warn).not.toHaveBeenCalled();
    expect(logger.debug).not.toHaveBeenCalled();
  });

  it.each([
    {
      fallback: false,
      value: 'secret-result',
      expected: 'boolean',
      actual: 'string',
    },
    { fallback: 12345, value: true, expected: 'number', actual: 'boolean' },
    {
      fallback: 'secret-fallback',
      value: 67890,
      expected: 'string',
      actual: 'number',
    },
  ])(
    'rejects a $actual result for a $expected fallback',
    async ({ fallback, value, expected, actual }) => {
      // Prepare
      const { flags, store, logger } = prepare();
      store.getMany.mockResolvedValue({
        checkout: { found: true, value, enabled: true },
      });
      // Act
      const result = flags.evaluate({ name: 'checkout', default: fallback });
      // Assess
      await expect(result).rejects.toBeInstanceOf(FlagValueTypeError);
      await expect(result).rejects.toThrow(
        `Flag 'checkout' expected type '${expected}' but received '${actual}'`
      );
      expect(logger.warn).not.toHaveBeenCalled();
      expect(logger.debug).not.toHaveBeenCalled();
    }
  );

  it.each([
    { value: { secret: 'hidden-value' }, kind: 'object' },
    { value: null, kind: 'null' },
    { value: undefined, kind: 'undefined' },
    { value: [{ secret: 'hidden-value' }], kind: 'an array containing object' },
    { value: () => 'hidden-value', kind: 'function' },
    { value: Symbol('hidden-value'), kind: 'symbol' },
    { value: [undefined], kind: 'an array containing undefined' },
    { value: [null], kind: 'an array containing null' },
    { value: Array(1), kind: 'an array containing undefined' },
    {
      value: ['valid', { secret: 'hidden-value' }],
      kind: 'an array containing object',
    },
    { value: [[null]], kind: 'an array containing an array containing null' },
    { value: 123456789n, kind: 'bigint' },
  ])('rejects $kind context before lookup', async ({ value, kind }) => {
    // Prepare
    const { flags, store } = prepare();
    // Act
    const result = flags.evaluate({
      name: 'checkout',
      default: false,
      // @ts-expect-error Test JavaScript callers that bypass context types.
      context: { invalidKey: value },
    });
    // Assess
    await expect(result).rejects.toBeInstanceOf(InvalidContextError);
    await expect(result).rejects.toHaveProperty(
      'message',
      `Invalid evaluation context key 'invalidKey': expected a string, number, boolean, or array of those, received ${kind}`
    );
    await expect(result).rejects.not.toThrow('hidden-value');
    expect(store.getMany).not.toHaveBeenCalled();
  });

  it('defaults context to an empty object', async () => {
    // Prepare
    const { flags, store } = prepare();
    store.getMany.mockResolvedValue({});
    // Act
    await flags.evaluate({ name: 'checkout', default: false });
    // Assess
    expect(store.getMany).toHaveBeenCalledExactlyOnceWith(['checkout'], {});
    expect(store.getAll).not.toHaveBeenCalled();
  });

  it('passes scalar context and arrays unchanged', async () => {
    // Prepare
    const { flags, store } = prepare();
    store.getMany.mockResolvedValue({});
    const context = {
      tier: 'premium',
      count: 0,
      enabled: false,
      facts: ['x', 1, true],
      empty: [],
      nan: Number.NaN,
      infinity: Number.POSITIVE_INFINITY,
    };
    // Act
    await flags.evaluate({ name: 'checkout', context, default: false });
    // Assess
    expect(store.getMany).toHaveBeenCalledExactlyOnceWith(
      ['checkout'],
      context
    );
  });

  it.each(['missing', 'unavailable'] as const)(
    'logs one private fallback warning for $0',
    async (reason) => {
      // Prepare
      const { flags, store, logger } = prepare();
      if (reason === 'missing') store.getMany.mockResolvedValue({});
      else
        store.getMany.mockRejectedValue(
          new StoreUnavailableError('Unavailable')
        );
      // Act
      await flags.evaluate({
        name: 'checkout',
        context: { secret: 'hidden' },
        default: false,
      });
      // Assess
      expect(logger.warn).toHaveBeenCalledExactlyOnceWith({
        name: 'checkout',
        store: 'in-memory',
        reason,
      });
      expect(logger.debug).toHaveBeenCalledExactlyOnceWith({
        name: 'checkout',
        store: 'in-memory',
        outcome: 'fallback',
      });
    }
  );

  it('logs one private success debug message', async () => {
    // Prepare
    const { flags, store, logger } = prepare();
    store.getMany.mockResolvedValue({
      checkout: { found: true, value: true, enabled: true },
    });
    // Act
    await flags.evaluate({
      name: 'checkout',
      context: { secret: 'hidden' },
      default: false,
    });
    // Assess
    expect(logger.debug).toHaveBeenCalledExactlyOnceWith({
      name: 'checkout',
      store: 'in-memory',
      outcome: 'found',
    });
    expect(logger.warn).not.toHaveBeenCalled();
  });

  it.each(['found', 'missing', 'unavailable'])(
    'emits nothing without a logger for $0',
    async (outcome) => {
      // Prepare
      const { store } = prepare();
      const flags = new FeatureFlags({ store });
      if (outcome === 'unavailable')
        store.getMany.mockRejectedValue(
          new StoreUnavailableError('Unavailable')
        );
      else
        store.getMany.mockResolvedValue(
          outcome === 'found'
            ? { checkout: { found: true, value: true, enabled: true } }
            : {}
        );
      // Act
      await flags.evaluate({ name: 'checkout', default: false });
      // Assess
      expect(console.debug).not.toHaveBeenCalled();
      expect(console.warn).not.toHaveBeenCalled();
    }
  );
});

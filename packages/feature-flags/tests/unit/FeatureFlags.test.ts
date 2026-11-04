import type { JSONValue } from '@aws-lambda-powertools/commons/types';
import { describe, expect, it, vi } from 'vitest';
import {
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
    { secret: 'hidden-value' },
    null,
    undefined,
    [{ secret: 'hidden-value' }],
    () => 'hidden-value',
    Symbol('hidden-value'),
    [undefined],
    [null],
    Array(1),
  ])('rejects invalid context value %j before lookup', async (value) => {
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
    await expect(result).rejects.toThrow(
      "Invalid evaluation context key 'invalidKey'"
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
      for (const field of ['context', 'default', 'fallback', 'value']) {
        expect(logger.warn).toHaveBeenCalledWith(
          expect.not.objectContaining({ [field]: expect.anything() })
        );
      }
      expect(logger.debug).not.toHaveBeenCalled();
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
    });
    for (const field of ['context', 'default', 'fallback', 'value']) {
      expect(logger.debug).toHaveBeenCalledWith(
        expect.not.objectContaining({ [field]: expect.anything() })
      );
    }
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

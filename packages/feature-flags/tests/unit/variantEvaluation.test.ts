import { describe, expect, it, vi } from 'vitest';
import {
  appConfigVariantStore,
  disabledVariant,
} from '../../src/appconfig-agent/index.js';
import {
  FeatureFlags,
  FlagValueTypeError,
  StoreUnavailableError,
} from '../../src/index.js';
import type { Store } from '../../src/types/index.js';

/** Creates a marked Variant store with isolated lookup spies and an evaluator logger. */
const prepare = () => {
  const store = appConfigVariantStore({
    environment: 'prod',
    name: 'features',
  });
  const getMany = vi.spyOn(store, 'getMany');
  const getAll = vi.spyOn(store, 'getAll');
  const logger = {
    debug: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
    error: vi.fn(),
  };
  return {
    store,
    getMany,
    getAll,
    logger,
    flags: new FeatureFlags({ store, logger }),
  };
};

describe('Variant evaluation', () => {
  it('returns the found Variant without applying primitive fallback checks', async () => {
    // Prepare
    const { flags, getMany, logger } = prepare();
    const value = {
      enabled: true,
      variant: 'beta',
      attributes: { secret: 'hidden' },
    };
    const context = { email: 'secret@example.org' };
    getMany.mockResolvedValue({ ui: { found: true, value, enabled: true } });
    // Act
    const result = await flags.evaluate({
      name: 'ui',
      default: disabledVariant(),
      context,
    });
    // Assess
    expect(result).toBe(value);
    expect(getMany).toHaveBeenCalledExactlyOnceWith(['ui'], context);
    expect(logger.debug).toHaveBeenCalledExactlyOnceWith({
      name: 'ui',
      store: 'appconfig-variant',
      outcome: 'found',
    });
    expect(logger.warn).not.toHaveBeenCalled();
  });

  it.each(['missing', 'unavailable'] as const)(
    'returns the original Variant fallback for $0',
    async (reason) => {
      // Prepare
      const { flags, getMany, logger } = prepare();
      const fallback = {
        enabled: false,
        variant: 'custom',
        attributes: { secret: ['hidden', 1, false] },
      };
      if (reason === 'missing')
        getMany.mockResolvedValue({ ui: { found: false } });
      else getMany.mockRejectedValue(new StoreUnavailableError('secret'));
      // Act
      const result = await flags.evaluate({ name: 'ui', default: fallback });
      // Assess
      expect(result).toBe(fallback);
      expect(logger.warn).toHaveBeenCalledExactlyOnceWith({
        name: 'ui',
        store: 'appconfig-variant',
        reason,
      });
      expect(logger.debug).toHaveBeenCalledExactlyOnceWith({
        name: 'ui',
        store: 'appconfig-variant',
        outcome: 'fallback',
      });
    }
  );

  it.each([
    false,
    null,
    [],
    'secret',
    undefined,
    {},
    { enabled: false, variant: 'default', attributes: {}, extra: 'secret' },
    {
      enabled: false,
      variant: 'default',
      attributes: {},
      [Symbol('extra')]: 'secret',
    },
    Object.defineProperty(disabledVariant(), 'extra', { value: 'secret' }),
    { enabled: 'secret', variant: 'default', attributes: {} },
    { enabled: false, variant: 123, attributes: {} },
    { enabled: false, variant: 'default', attributes: null },
    { enabled: false, variant: 'default', attributes: [] },
    {
      enabled: false,
      variant: 'default',
      attributes: { nested: { secret: 'hidden' } },
    },
    {
      enabled: false,
      variant: 'default',
      attributes: { nonfinite: Number.POSITIVE_INFINITY },
    },
    { enabled: false, variant: 'default', attributes: { sparse: Array(1) } },
    Object.assign(Object.create({ enabled: false }), {
      variant: 'default',
      attributes: {},
      other: 'secret',
    }),
    Object.assign(Object.create({ variant: 'default' }), {
      enabled: false,
      attributes: {},
      other: 'secret',
    }),
    Object.assign(Object.create({ attributes: {} }), {
      enabled: false,
      variant: 'default',
      other: 'secret',
    }),
  ])(
    'rejects non-Variant fallback %j before single and batch Store calls',
    async (fallback) => {
      // Prepare
      const { flags, getMany, logger } = prepare();
      // Act
      // Reflect models untyped JavaScript calls without weakening the public signatures.
      const single = Reflect.apply(flags.evaluate, flags, [
        { name: 'ui', default: fallback },
      ]);
      const batch = Reflect.apply(flags.evaluateMany, flags, [
        { flags: { valid: disabledVariant(), ui: fallback } },
      ]);
      // Assess
      await expect(single).rejects.toBeInstanceOf(FlagValueTypeError);
      await expect(batch).rejects.toBeInstanceOf(FlagValueTypeError);
      await expect(single).rejects.toThrow(
        "Flag 'ui' requires a Variant fallback"
      );
      await expect(batch).rejects.toThrow(
        "Flag 'ui' requires a Variant fallback"
      );
      expect(getMany).not.toHaveBeenCalled();
      expect(logger.warn).not.toHaveBeenCalled();
      expect(logger.debug).not.toHaveBeenCalled();
    }
  );

  it('returns found Variants and independent fallbacks in one batch', async () => {
    // Prepare
    const { flags, getMany, logger } = prepare();
    const value = { enabled: true, variant: 'beta', attributes: { count: 10 } };
    const fallback = disabledVariant();
    getMany.mockResolvedValue({
      ui: { found: true, value, enabled: true },
      missing: { found: false },
    });
    // Act
    const result = await flags.evaluateMany({
      flags: { ui: disabledVariant(), missing: fallback },
    });
    // Assess
    expect(result.ui).toBe(value);
    expect(result.missing).toBe(fallback);
    expect(getMany).toHaveBeenCalledExactlyOnceWith(['ui', 'missing'], {});
    expect(logger.warn).toHaveBeenCalledExactlyOnceWith({
      store: 'appconfig-variant',
      reason: 'missing',
      names: ['missing'],
    });
    expect(logger.debug).toHaveBeenCalledExactlyOnceWith({
      store: 'appconfig-variant',
      outcome: 'partial',
      names: ['ui', 'missing'],
    });
  });

  it('returns original Variant fallbacks for an unavailable batch', async () => {
    // Prepare
    const { flags, getMany, logger } = prepare();
    const fallback = disabledVariant();
    getMany.mockRejectedValue(new StoreUnavailableError('secret'));
    // Act
    const result = await flags.evaluateMany({ flags: { ui: fallback } });
    // Assess
    expect(result.ui).toBe(fallback);
    expect(logger.warn).toHaveBeenCalledExactlyOnceWith({
      store: 'appconfig-variant',
      reason: 'unavailable',
      names: ['ui'],
    });
    expect(logger.debug).toHaveBeenCalledExactlyOnceWith({
      store: 'appconfig-variant',
      outcome: 'fallback',
      names: ['ui'],
    });
  });

  it('selects enabled features from the explicit enabled field', async () => {
    // Prepare
    const { flags, getAll, logger } = prepare();
    getAll.mockResolvedValue({
      disabled: {
        found: true,
        enabled: false,
        value: {
          enabled: false,
          variant: 'beta',
          attributes: { nonempty: true },
        },
      },
      enabled: {
        found: true,
        enabled: true,
        value: { enabled: true, variant: 'default', attributes: {} },
      },
      missing: { found: false },
    });
    // Act
    const result = await flags.getEnabledFeatures({
      context: { tier: 'premium' },
    });
    // Assess
    expect(result).toEqual(['enabled']);
    expect(getAll).toHaveBeenCalledExactlyOnceWith({ tier: 'premium' });
    expect(logger.debug).toHaveBeenCalledExactlyOnceWith({
      store: 'appconfig-variant',
      outcome: 'found',
      enabled: 1,
    });
    expect(logger.warn).not.toHaveBeenCalled();
  });

  it('creates fresh disabled Variant objects and attribute maps', () => {
    // Prepare
    const first = disabledVariant();
    // Act
    first.attributes.mutated = true;
    const second = disabledVariant();
    // Assess
    expect(second).toEqual({
      enabled: false,
      variant: 'default',
      attributes: {},
    });
    expect(first).not.toBe(second);
    expect(first.attributes).not.toBe(second.attributes);
  });

  it('does not infer Variant runtime behavior from a custom store name', async () => {
    // Prepare
    const store: Store = {
      name: 'appconfig-variant',
      getMany: vi.fn().mockResolvedValue({}),
      getAll: vi.fn(),
    };
    const flags = new FeatureFlags({ store });
    // Act
    const result = await flags.evaluate({ name: 'ui', default: false });
    // Assess
    expect(result).toBe(false);
    expect(store.getMany).toHaveBeenCalledExactlyOnceWith(['ui'], {});
  });
});

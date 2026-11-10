import { describe, expect, it, vi } from 'vitest';
import {
  type EvaluationContext,
  FeatureFlags,
  FlagResultValidationError,
  FlagValueTypeError,
  InvalidContextError,
  type Store,
  StoreUnavailableError,
} from '../../src/index.js';
import {
  asyncSettingsSchema,
  createSchema,
  createUndefinedOutputSchema,
  dateSchema,
  flexibleSchema,
  numberSchema,
  schemaIssues,
  secretIssueMessage,
  settingsSchema,
} from '../helpers/standardSchema.js';

/** Creates an isolated Store and logger for schema evaluation tests. */
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
  return { store, logger, flags: new FeatureFlags({ store, logger }) };
};

describe('Standard Schema evaluation', () => {
  it.each([
    { method: 'evaluate', source: 'fallback' },
    { method: 'evaluate', source: 'result' },
    { method: 'evaluateMany', source: 'fallback' },
    { method: 'evaluateMany', source: 'result' },
  ] as const)(
    'rejects undefined output from the $method $source schema validation',
    async ({ method, source }) => {
      // Prepare
      const { flags, store, logger } = prepare();
      const schema = createUndefinedOutputSchema(source);
      store.getMany.mockResolvedValue({
        settings: { found: true, value: 'result', enabled: true },
      });
      // Act
      const result =
        method === 'evaluate'
          ? flags.evaluate({ name: 'settings', default: 'fallback', schema })
          : flags.evaluateMany({
              flags: { banner: 'none', settings: 'fallback' },
              schemas: { settings: schema },
            });
      // Assess
      await expect(result).rejects.toBeInstanceOf(FlagResultValidationError);
      await expect(result).rejects.toMatchObject({
        flag: 'settings',
        source,
        cause: [],
        message: `Flag 'settings' ${source} failed schema validation at (root)`,
      });
      if (source === 'fallback') expect(store.getMany).not.toHaveBeenCalled();
      else
        expect(store.getMany).toHaveBeenCalledExactlyOnceWith(
          method === 'evaluate' ? ['settings'] : ['banner', 'settings'],
          {}
        );
      expect(logger.warn).not.toHaveBeenCalled();
      expect(logger.debug).not.toHaveBeenCalled();
    }
  );

  it.each([
    { method: 'evaluate', outcome: 'found' },
    { method: 'evaluate', outcome: 'missing' },
    { method: 'evaluate', outcome: 'unavailable' },
    { method: 'evaluateMany', outcome: 'found' },
    { method: 'evaluateMany', outcome: 'missing' },
    { method: 'evaluateMany', outcome: 'unavailable' },
  ] as const)(
    'returns numeric schema output for $method with a $outcome Store outcome',
    async ({ method, outcome }) => {
      // Prepare
      const { flags, store } = prepare();
      if (outcome === 'unavailable')
        store.getMany.mockRejectedValue(new StoreUnavailableError('secret'));
      else
        store.getMany.mockResolvedValue(
          outcome === 'found'
            ? {
                settings: { found: true, value: '10', enabled: true },
              }
            : {}
        );
      // Act
      const result =
        method === 'evaluate'
          ? await flags.evaluate({
              name: 'settings',
              default: '5',
              schema: numberSchema,
            })
          : (
              await flags.evaluateMany({
                flags: { settings: '5' },
                schemas: { settings: numberSchema },
              })
            ).settings;
      // Assess
      expect(result).toBe(outcome === 'found' ? 10 : 5);
      expect(store.getMany).toHaveBeenCalledExactlyOnceWith(['settings'], {});
    }
  );

  it.each([
    { method: 'evaluate', outcome: 'found' },
    { method: 'evaluate', outcome: 'missing' },
    { method: 'evaluate', outcome: 'unavailable' },
    { method: 'evaluateMany', outcome: 'found' },
    { method: 'evaluateMany', outcome: 'missing' },
    { method: 'evaluateMany', outcome: 'unavailable' },
  ] as const)(
    'returns Date schema output for $method with a $outcome Store outcome',
    async ({ method, outcome }) => {
      // Prepare
      const { flags, store } = prepare();
      const fallback = '2026-01-01T00:00:00.000Z';
      const value = '2026-11-10T00:00:00.000Z';
      if (outcome === 'unavailable')
        store.getMany.mockRejectedValue(new StoreUnavailableError('secret'));
      else
        store.getMany.mockResolvedValue(
          outcome === 'found'
            ? {
                settings: { found: true, value, enabled: true },
              }
            : {}
        );
      // Act
      const result =
        method === 'evaluate'
          ? await flags.evaluate({
              name: 'settings',
              default: fallback,
              schema: dateSchema,
            })
          : (
              await flags.evaluateMany({
                flags: { settings: fallback },
                schemas: { settings: dateSchema },
              })
            ).settings;
      // Assess
      expect(result).toBeInstanceOf(Date);
      expect(result).toEqual(new Date(outcome === 'found' ? value : fallback));
      expect(store.getMany).toHaveBeenCalledExactlyOnceWith(['settings'], {});
    }
  );

  it.each([
    { kind: 'sync', schema: settingsSchema },
    { kind: 'async', schema: asyncSettingsSchema },
  ])('returns the validated $kind result', async ({ schema }) => {
    // Prepare
    const { flags, store, logger } = prepare();
    const value = { theme: 'dark' };
    const context = { tier: 'premium' };
    store.getMany.mockResolvedValue({
      settings: { found: true, value, enabled: true },
    });
    // Act
    const result = await flags.evaluate({
      name: 'settings',
      default: { theme: 'light' },
      context,
      schema,
    });
    // Assess
    expect(result).toEqual({ theme: 'dark', validated: true });
    expect(result).not.toBe(value);
    expect(store.getMany).toHaveBeenCalledExactlyOnceWith(
      ['settings'],
      context
    );
    expect(logger.debug).toHaveBeenCalledExactlyOnceWith({
      name: 'settings',
      store: 'in-memory',
      outcome: 'found',
    });
    expect(logger.warn).not.toHaveBeenCalled();
  });

  it.each(['missing', 'unavailable'] as const)(
    'returns the validated fallback for a $0 flag',
    async (reason) => {
      // Prepare
      const { flags, store, logger } = prepare();
      if (reason === 'missing') store.getMany.mockResolvedValue({});
      else store.getMany.mockRejectedValue(new StoreUnavailableError('secret'));
      // Act
      const result = await flags.evaluate({
        name: 'settings',
        default: { theme: 'light' },
        schema: settingsSchema,
      });
      // Assess
      expect(result).toEqual({ theme: 'light', validated: true });
      expect(logger.warn).toHaveBeenCalledExactlyOnceWith({
        name: 'settings',
        store: 'in-memory',
        reason,
      });
      expect(logger.debug).toHaveBeenCalledExactlyOnceWith({
        name: 'settings',
        store: 'in-memory',
        outcome: 'fallback',
      });
    }
  );

  it.each(['evaluate', 'evaluateMany'] as const)(
    'rejects an invalid fallback before the $0 Store call',
    async (method) => {
      // Prepare
      const { flags, store, logger } = prepare();
      store.getMany.mockResolvedValue({
        settings: { found: true, value: { theme: 'dark' }, enabled: true },
      });
      const fallback = { theme: 'invalid-value-secret' };
      // Act
      const result =
        method === 'evaluate'
          ? flags.evaluate({
              name: 'settings',
              default: fallback,
              schema: settingsSchema,
            })
          : flags.evaluateMany({
              flags: { settings: fallback },
              schemas: { settings: settingsSchema },
            });
      // Assess
      await expect(result).rejects.toBeInstanceOf(FlagResultValidationError);
      await expect(result).rejects.toMatchObject({
        flag: 'settings',
        source: 'fallback',
        cause: schemaIssues,
        message:
          "Flag 'settings' fallback failed schema validation at settings.theme.0",
      });
      expect(store.getMany).not.toHaveBeenCalled();
      expect(logger.debug).not.toHaveBeenCalled();
      expect(logger.warn).not.toHaveBeenCalled();
    }
  );

  it.each(['evaluate', 'evaluateMany'] as const)(
    'rejects an invalid $0 result without exposing values or issue messages',
    async (method) => {
      // Prepare
      const { flags, store, logger } = prepare();
      store.getMany.mockResolvedValue({
        banner: { found: true, value: 'welcome', enabled: true },
        settings: {
          found: true,
          value: { theme: 'invalid-value-secret' },
          enabled: true,
        },
      });
      // Act
      const result =
        method === 'evaluate'
          ? flags.evaluate({
              name: 'settings',
              default: { theme: 'light' },
              schema: settingsSchema,
            })
          : flags.evaluateMany({
              flags: { banner: 'none', settings: { theme: 'light' } },
              schemas: { settings: settingsSchema },
            });
      // Assess
      await expect(result).rejects.toBeInstanceOf(FlagResultValidationError);
      await expect(result).rejects.toMatchObject({
        flag: 'settings',
        source: 'result',
        message:
          "Flag 'settings' result failed schema validation at settings.theme.0",
      });
      await expect(result).rejects.toHaveProperty('cause', schemaIssues);
      await expect(result).rejects.not.toThrow(secretIssueMessage);
      await expect(result).rejects.not.toThrow('invalid-value-secret');
      expect(store.getMany).toHaveBeenCalledTimes(1);
      expect(logger.debug).not.toHaveBeenCalled();
      expect(logger.warn).not.toHaveBeenCalled();
    }
  );

  it.each(['evaluate', 'evaluateMany'] as const)(
    'replaces the $0 primitive check with the schema',
    async (method) => {
      // Prepare
      const { flags, store } = prepare();
      store.getMany.mockResolvedValue({
        settings: { found: true, value: { theme: 'dark' }, enabled: true },
      });
      // Act
      const result =
        method === 'evaluate'
          ? await flags.evaluate({
              name: 'settings',
              default: 'light',
              schema: flexibleSchema,
            })
          : await flags.evaluateMany({
              flags: { settings: 'light' },
              schemas: { settings: flexibleSchema },
            });
      // Assess
      expect(result).toEqual(
        method === 'evaluate'
          ? { theme: 'dark' }
          : { settings: { theme: 'dark' } }
      );
    }
  );

  it.each(['found', 'missing', 'unavailable'] as const)(
    'returns mixed batch values for a $0 Store outcome',
    async (outcome) => {
      // Prepare
      const { flags, store, logger } = prepare();
      const context = { tier: 'premium' };
      if (outcome === 'unavailable')
        store.getMany.mockRejectedValue(new StoreUnavailableError('secret'));
      else
        store.getMany.mockResolvedValue(
          outcome === 'found'
            ? {
                settings: {
                  found: true,
                  value: { theme: 'dark' },
                  enabled: true,
                },
                banner: { found: true, value: 'welcome', enabled: true },
              }
            : { settings: { found: false } }
        );
      // Act
      const result = await flags.evaluateMany({
        flags: { settings: { theme: 'light' }, banner: 'none' },
        schemas: { settings: asyncSettingsSchema },
        context,
      });
      // Assess
      expect(result).toEqual({
        settings: {
          theme: outcome === 'found' ? 'dark' : 'light',
          validated: true,
        },
        banner: outcome === 'found' ? 'welcome' : 'none',
      });
      expect(store.getMany).toHaveBeenCalledExactlyOnceWith(
        ['settings', 'banner'],
        context
      );
      expect(logger.debug).toHaveBeenCalledExactlyOnceWith({
        store: 'in-memory',
        outcome: outcome === 'found' ? 'found' : 'fallback',
        names: ['settings', 'banner'],
      });
      if (outcome === 'found') expect(logger.warn).not.toHaveBeenCalled();
      else
        expect(logger.warn).toHaveBeenCalledExactlyOnceWith({
          store: 'in-memory',
          reason: outcome,
          names: ['settings', 'banner'],
        });
    }
  );

  it('keeps the primitive check for batch keys without schemas', async () => {
    // Prepare
    const { flags, store, logger } = prepare();
    store.getMany.mockResolvedValue({
      settings: { found: true, value: { theme: 'dark' }, enabled: true },
      banner: { found: true, value: 10, enabled: true },
    });
    // Act
    const result = flags.evaluateMany({
      flags: { settings: { theme: 'light' }, banner: 'none' },
      schemas: { settings: settingsSchema },
    });
    // Assess
    await expect(result).rejects.toBeInstanceOf(FlagValueTypeError);
    await expect(result).rejects.toThrow(
      "Flag 'banner' expected type 'string' but received 'number'"
    );
    expect(logger.debug).not.toHaveBeenCalled();
    expect(logger.warn).not.toHaveBeenCalled();
  });

  it('throws the first invalid batch fallback before contacting the Store', async () => {
    // Prepare
    const { flags, store } = prepare();
    const secondValidator = vi.fn(settingsSchema['~standard'].validate);
    const secondSchema = createSchema<
      { theme: string },
      { theme: string; validated: boolean }
    >(secondValidator);
    // Act
    const result = flags.evaluateMany({
      flags: {
        first: { theme: 'invalid-value-secret' },
        second: { theme: 'invalid-value-secret' },
      },
      schemas: { first: settingsSchema, second: secondSchema },
    });
    // Assess
    await expect(result).rejects.toMatchObject({
      flag: 'first',
      source: 'fallback',
    });
    expect(secondValidator).not.toHaveBeenCalled();
    expect(store.getMany).not.toHaveBeenCalled();
  });

  it('validates every batch fallback before contacting the Store', async () => {
    // Prepare
    const { flags, store } = prepare();
    const calls: string[] = [];
    const schema = createSchema<string, string>(async (value) => {
      calls.push(String(value));
      return { value: String(value) };
    });
    store.getMany.mockImplementation(async () => {
      calls.push('store');
      return { first: { found: true, value: 'result', enabled: true } };
    });
    // Act
    await flags.evaluateMany({
      flags: { first: 'first-fallback', second: 'second-fallback' },
      schemas: { first: schema, second: schema },
    });
    // Assess
    expect(calls).toEqual([
      'first-fallback',
      'second-fallback',
      'store',
      'result',
    ]);
    expect(store.getMany).toHaveBeenCalledExactlyOnceWith(
      ['first', 'second'],
      {}
    );
  });

  it.each(['evaluate', 'evaluateMany'] as const)(
    'validates context before the $0 fallback',
    async (method) => {
      // Prepare
      const { flags, store } = prepare();
      const validate = vi.fn(settingsSchema['~standard'].validate);
      const schema = createSchema<
        { theme: string },
        { theme: string; validated: boolean }
      >(validate);
      // @ts-expect-error Test JavaScript callers that bypass context types.
      const context: EvaluationContext = { invalid: null };
      // Act
      const result =
        method === 'evaluate'
          ? flags.evaluate({
              name: 'settings',
              default: { theme: 'light' },
              schema,
              context,
            })
          : flags.evaluateMany({
              flags: { settings: { theme: 'light' } },
              schemas: { settings: schema },
              context,
            });
      // Assess
      await expect(result).rejects.toBeInstanceOf(InvalidContextError);
      expect(validate).not.toHaveBeenCalled();
      expect(store.getMany).not.toHaveBeenCalled();
    }
  );

  it('preserves special batch names with and without schemas', async () => {
    // Prepare
    const { flags, store } = prepare();
    store.getMany.mockResolvedValue({
      ['__proto__']: { found: true, value: { theme: 'dark' }, enabled: true },
      toString: { found: true, value: 'stored', enabled: true },
    });
    // Act
    const result = await flags.evaluateMany({
      flags: { ['__proto__']: { theme: 'light' }, toString: 'fallback' },
      schemas: { ['__proto__']: settingsSchema },
    });
    // Assess
    expect(result).toEqual({
      ['__proto__']: { theme: 'dark', validated: true },
      toString: 'stored',
    });
    expect(store.getMany).toHaveBeenCalledExactlyOnceWith(
      ['__proto__', 'toString'],
      {}
    );
  });
});

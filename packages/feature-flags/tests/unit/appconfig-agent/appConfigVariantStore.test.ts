import {
  AppConfigAgentError,
  FlagNotFoundError,
  GetParameterError,
  ParameterNotFoundError,
  TransformParameterError,
} from '@aws-lambda-powertools/parameters/errors';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { appConfigVariantStore } from '../../../src/appconfig-agent/index.js';
import {
  InvalidContextError,
  SchemaValidationError,
  StoreUnavailableError,
} from '../../../src/errors.js';
import type {
  EvaluationContext,
  StoreResult,
  Variant,
} from '../../../src/types/index.js';

const getConfigMock = vi.hoisted(() => vi.fn());
vi.mock('@aws-lambda-powertools/parameters/appconfig-agent', () => ({
  getConfig: getConfigMock,
}));

describe('appConfigVariantStore', () => {
  const options = {
    application: 'my-app',
    environment: 'prod',
    name: 'features',
    timeout: 1000,
  };
  const context = {
    email: 'jane@example.org',
    opted_in_to_beta: true,
    count: 10,
  };

  beforeEach(() => {
    getConfigMock.mockReset();
    vi.stubEnv('POWERTOOLS_DEV', 'false');
    vi.stubEnv('AWS_LAMBDA_INITIALIZATION_TYPE', 'on-demand');
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it.each([
    {
      flag: {
        enabled: true,
        _variant: 'beta',
        color: 'blue',
        limit: 10,
        opted_in: true,
        groups: ['a', 1, false],
      },
      value: {
        enabled: true,
        variant: 'beta',
        attributes: {
          color: 'blue',
          limit: 10,
          opted_in: true,
          groups: ['a', 1, false],
        },
      },
    },
    {
      flag: { enabled: false },
      value: { enabled: false, variant: 'default', attributes: {} },
    },
    {
      flag: { enabled: true, _variant: '' },
      value: { enabled: true, variant: '', attributes: {} },
    },
    {
      flag: { enabled: true, _variant: 'default', empty: [] },
      value: { enabled: true, variant: 'default', attributes: { empty: [] } },
    },
  ])(
    'normalizes a selective flag %j and passes exact Agent options',
    async ({ flag, value }) => {
      // Prepare
      getConfigMock.mockResolvedValue(flag);
      const store = appConfigVariantStore(options);
      // Act
      const result = await store.getMany(['ui'], context);
      // Assess
      expect(result).toEqual({
        ui: { found: true, value, enabled: value.enabled },
      });
      expect(store.name).toBe('appconfig-variant');
      expect(getConfigMock).toHaveBeenCalledExactlyOnceWith('features', {
        application: 'my-app',
        environment: 'prod',
        timeout: 1000,
        transform: 'json',
        throwOnMissing: true,
        agentOptions: { flags: ['ui'], context },
      });
    }
  );

  it('reports a missing selective flag without treating its profile as missing', async () => {
    // Prepare
    getConfigMock.mockRejectedValue(new FlagNotFoundError('secret', ['ui']));
    const store = appConfigVariantStore(options);
    // Act
    const result = await store.getMany(['ui'], context);
    // Assess
    expect(result).toEqual({ ui: { found: false } });
    expect(getConfigMock).toHaveBeenCalledOnce();
  });

  it('retrieves one whole profile and ignores unrequested malformed flags', async () => {
    // Prepare
    getConfigMock.mockResolvedValue({
      ui: { enabled: true, _variant: 'premium' },
      unrelated: { enabled: 'secret' },
    });
    const store = appConfigVariantStore(options);
    // Act
    const result = await store.getMany(['ui', 'missing', 'ui'], context);
    // Assess
    expect(result).toEqual({
      ui: {
        found: true,
        enabled: true,
        value: { enabled: true, variant: 'premium', attributes: {} },
      },
      missing: { found: false },
    });
    expect(getConfigMock).toHaveBeenCalledExactlyOnceWith('features', {
      application: 'my-app',
      environment: 'prod',
      timeout: 1000,
      transform: 'json',
      throwOnMissing: true,
      agentOptions: { context },
    });
  });

  it('deduplicates names before choosing selective retrieval', async () => {
    // Prepare
    getConfigMock.mockResolvedValue({ enabled: true });
    const store = appConfigVariantStore(options);
    // Act
    const result = await store.getMany(['ui', 'ui'], {});
    // Assess
    expect(Object.keys(result)).toEqual(['ui']);
    expect(getConfigMock).toHaveBeenCalledExactlyOnceWith('features', {
      application: 'my-app',
      environment: 'prod',
      timeout: 1000,
      transform: 'json',
      throwOnMissing: true,
      agentOptions: { flags: ['ui'], context: {} },
    });
  });

  it('normalizes every flag from getAll without selective flags', async () => {
    // Prepare
    getConfigMock.mockResolvedValue({
      ui: { enabled: true, _variant: 'beta' },
      basic: { enabled: false, color: 'blue' },
    });
    const store = appConfigVariantStore(options);
    // Act
    const result = await store.getAll(context);
    // Assess
    expect(result).toEqual({
      ui: {
        found: true,
        enabled: true,
        value: { enabled: true, variant: 'beta', attributes: {} },
      },
      basic: {
        found: true,
        enabled: false,
        value: {
          enabled: false,
          variant: 'default',
          attributes: { color: 'blue' },
        },
      },
    });
    expect(getConfigMock).toHaveBeenCalledExactlyOnceWith('features', {
      application: 'my-app',
      environment: 'prod',
      timeout: 1000,
      transform: 'json',
      throwOnMissing: true,
      agentOptions: { context },
    });
  });

  it.each([{ names: [] }, { names: ['missing', 'unknown'] }])(
    'handles requested names %j from an empty profile',
    async ({ names }) => {
      // Prepare
      getConfigMock.mockResolvedValue({});
      const store = appConfigVariantStore(options);
      const expected: [string, StoreResult<Variant>][] = [];
      for (const name of names) {
        expected.push([name, { found: false }]);
      }
      // Act
      const result = await store.getMany(names, {});
      // Assess
      expect(result).toEqual(Object.fromEntries(expected));
      expect(getConfigMock).toHaveBeenCalledOnce();
    }
  );

  const malformedFlags: unknown[] = [
    null,
    [],
    'secret',
    123,
    true,
    {},
    { enabled: 'secret' },
    { enabled: true, _variant: undefined },
    { enabled: true, _variant: null },
    { enabled: true, _variant: 123 },
    { enabled: true, _variant: [] },
  ];
  for (const attribute of [
    null,
    undefined,
    { secret: 'hidden' },
    [['secret']],
    ['secret', null],
    Number.NaN,
    Number.POSITIVE_INFINITY,
    [Number.POSITIVE_INFINITY],
    Array(1),
  ]) {
    malformedFlags.push({ enabled: true, attribute });
  }
  it.each(malformedFlags)(
    'rejects malformed flag %j without exposing values',
    async (flag) => {
      // Prepare
      getConfigMock.mockResolvedValue(flag);
      const store = appConfigVariantStore(options);
      // Act
      const result = store.getMany(['ui'], {});
      // Assess
      await expect(result).rejects.toBeInstanceOf(SchemaValidationError);
      await expect(result).rejects.toThrow("Flag 'ui'");
      await expect(result).rejects.not.toThrow('secret');
      await expect(result).rejects.not.toThrow('hidden');
      await expect(result).rejects.not.toThrow('123');
    }
  );

  it.each(['batch', 'all'] as const)(
    'rejects requested malformed flags from $0 retrieval',
    async (method) => {
      // Prepare
      getConfigMock.mockResolvedValue({ broken: { enabled: 'secret' } });
      const store = appConfigVariantStore(options);
      // Act
      const result =
        method === 'all'
          ? store.getAll({})
          : store.getMany(['broken', 'missing'], {});
      // Assess
      await expect(result).rejects.toBeInstanceOf(SchemaValidationError);
      await expect(result).rejects.toThrow("Flag 'broken'");
      await expect(result).rejects.not.toThrow('secret');
    }
  );

  it.each([null, [], 'secret', 123, true, undefined])(
    'rejects non-object whole profile %j',
    async (profile) => {
      // Prepare
      getConfigMock.mockResolvedValue(profile);
      const store = appConfigVariantStore(options);
      // Act
      const result = store.getAll({});
      // Assess
      await expect(result).rejects.toBeInstanceOf(SchemaValidationError);
      await expect(result).rejects.toThrow(
        'AppConfig Variant profile must be an object'
      );
      await expect(result).rejects.not.toThrow('secret');
    }
  );

  it.each([
    new AppConfigAgentError('secret', 503),
    new AppConfigAgentError('secret', 429),
    new AppConfigAgentError('secret', 500),
    new GetParameterError('secret', {
      cause: new DOMException('secret', 'TimeoutError'),
    }),
    new GetParameterError('secret', { cause: new TypeError('fetch failed') }),
  ])(
    'wraps availability failure $name and preserves its cause',
    async (error) => {
      // Prepare
      getConfigMock.mockRejectedValue(error);
      const store = appConfigVariantStore(options);
      // Act
      const result = store.getMany(['ui'], {});
      // Assess
      await expect(result).rejects.toBeInstanceOf(StoreUnavailableError);
      await expect(result).rejects.toHaveProperty('cause', error);
      await expect(result).rejects.toThrow('appconfig-variant is unavailable');
    }
  );

  it.each([
    new ParameterNotFoundError('missing profile'),
    new AppConfigAgentError('denied', 403),
    new AppConfigAgentError('denied', 401),
    new AppConfigAgentError('malformed', 400),
    new TransformParameterError('json', 'secret'),
    new Error('unexpected'),
  ])(
    'rethrows configuration failure $name as the same instance',
    async (error) => {
      // Prepare
      getConfigMock.mockRejectedValue(error);
      const store = appConfigVariantStore(options);
      // Act
      const result = store.getMany(['ui'], {});
      // Assess
      await expect(result).rejects.toBe(error);
    }
  );

  it('rethrows unexpected missing-flag errors from whole-profile retrieval', async () => {
    // Prepare
    const error = new FlagNotFoundError('secret', ['ui']);
    getConfigMock.mockRejectedValue(error);
    const store = appConfigVariantStore(options);
    // Act
    const result = store.getAll({});
    // Assess
    await expect(result).rejects.toBe(error);
  });

  const invalidContexts: { key: string; value: unknown }[] = [
    { key: 'array', value: [] },
    { key: 'nan', value: Number.NaN },
    { key: 'infinite', value: Number.POSITIVE_INFINITY },
    { key: 'object', value: { secret: 'hidden' } },
    { key: 'null', value: null },
    { key: 'undefined', value: undefined },
  ];
  for (const key of [
    '',
    '1key',
    'bad key',
    'é',
    'injected, admin',
    'bad=key',
    'bad\r\nkey',
  ]) {
    invalidContexts.push({ key, value: 'secret' });
  }
  it.each(invalidContexts)(
    'rejects context key $key before calling Parameters',
    async ({ key, value }) => {
      // Prepare
      const store = appConfigVariantStore(options);
      // @ts-expect-error Exercise JavaScript contexts outside the supported contract.
      const invalid: EvaluationContext = { [key]: value };
      // Act
      const result = store.getAll(invalid);
      // Assess
      await expect(result).rejects.toBeInstanceOf(InvalidContextError);
      await expect(result).rejects.toHaveProperty(
        'message',
        `Invalid evaluation context key '${key}'`
      );
      expect(getConfigMock).not.toHaveBeenCalled();
    }
  );

  it.each(['outside Lambda', 'POWERTOOLS_DEV'])(
    'uses a whole profile for a single flag in $0 local mode',
    async (mode) => {
      // Prepare
      if (mode === 'outside Lambda')
        vi.stubEnv('AWS_LAMBDA_INITIALIZATION_TYPE', undefined);
      else vi.stubEnv('POWERTOOLS_DEV', 'true');
      getConfigMock.mockResolvedValue({ ui: { enabled: true } });
      const store = appConfigVariantStore({
        environment: 'prod',
        name: 'features',
      });
      // Act
      const result = await store.getMany(['ui'], context);
      // Assess
      expect(result).toEqual({
        ui: {
          found: true,
          enabled: true,
          value: { enabled: true, variant: 'default', attributes: {} },
        },
      });
      expect(getConfigMock).toHaveBeenCalledExactlyOnceWith('features', {
        application: undefined,
        environment: 'prod',
        timeout: undefined,
        transform: 'json',
        throwOnMissing: true,
        agentOptions: { context },
      });
    }
  );

  it('preserves own special flag and attribute keys without selecting inherited names', async () => {
    // Prepare
    getConfigMock.mockResolvedValue(
      JSON.parse('{"__proto__":{"enabled":true,"__proto__":"safe"}}')
    );
    const store = appConfigVariantStore(options);
    // Act
    const result = await store.getMany(['__proto__', 'toString'], {});
    // Assess
    expect(result).toEqual({
      ['__proto__']: {
        found: true,
        enabled: true,
        value: {
          enabled: true,
          variant: 'default',
          attributes: { ['__proto__']: 'safe' },
        },
      },
      toString: { found: false },
    });
  });

  it('logs only the selected flag and Variant names', async () => {
    // Prepare
    const logger = {
      debug: vi.fn(),
      warn: vi.fn(),
      info: vi.fn(),
      error: vi.fn(),
    };
    getConfigMock.mockResolvedValue({
      enabled: true,
      _variant: 'beta',
      secret: 'hidden',
    });
    const store = appConfigVariantStore({ ...options, logger });
    // Act
    await store.getMany(['ui'], { secret: 'hidden' });
    // Assess
    expect(logger.debug).toHaveBeenCalledExactlyOnceWith({
      store: 'appconfig-variant',
      name: 'ui',
      variant: 'beta',
    });
    expect(logger.warn).not.toHaveBeenCalled();
  });

  it('delegates context encoding and retrieves on every call', async () => {
    // Prepare
    const specialContext = {
      _label: ' a,b=c"\n你好 ',
      'tenant.id': '',
      'opted-in': false,
      count: 0,
      injection: 'x", admin=true\r\nOther: injected',
    };
    getConfigMock.mockResolvedValue({ enabled: true });
    const store = appConfigVariantStore(options);
    // Act
    await store.getMany(['ui'], specialContext);
    await store.getMany(['ui'], specialContext);
    // Assess
    expect(getConfigMock).toHaveBeenCalledTimes(2);
    expect(getConfigMock).toHaveBeenNthCalledWith(1, 'features', {
      application: 'my-app',
      environment: 'prod',
      timeout: 1000,
      transform: 'json',
      throwOnMissing: true,
      agentOptions: { flags: ['ui'], context: specialContext },
    });
    expect(getConfigMock.mock.calls[1]).toEqual(getConfigMock.mock.calls[0]);
  });
});

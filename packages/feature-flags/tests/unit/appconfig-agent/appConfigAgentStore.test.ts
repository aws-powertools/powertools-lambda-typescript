import {
  AppConfigAgentError,
  GetParameterError,
  ParameterNotFoundError,
  TransformParameterError,
} from '@aws-lambda-powertools/parameters/errors';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { appConfigAgentStore } from '../../../src/appconfig-agent/index.js';
import {
  FeatureFlags,
  FeatureFlagsError,
  SchemaValidationError,
} from '../../../src/index.js';

describe('appConfigAgentStore', () => {
  const fetchMock = vi.fn<typeof fetch>();
  const options = {
    application: 'my-app',
    environment: 'prod',
    name: 'features',
  };

  beforeEach(() => {
    fetchMock.mockReset();
    fetchMock.mockResolvedValue(new Response('{"checkout":{"default":true}}'));
    vi.stubGlobal('fetch', fetchMock);
    vi.stubEnv('POWERTOOLS_DEV', 'false');
    vi.stubEnv('AWS_LAMBDA_INITIALIZATION_TYPE', 'on-demand');
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it('retrieves JSON and evaluates a flag', async () => {
    // Prepare
    const store = appConfigAgentStore(options);
    const flags = new FeatureFlags({ store });
    // Act
    const result = await flags.evaluate({ name: 'checkout', default: false });
    // Assess
    expect(result).toBe(true);
    expect(store.name).toBe('appconfig-agent');
    expect(fetchMock).toHaveBeenCalledExactlyOnceWith(
      'http://localhost:2772/applications/my-app/environments/prod/configurations/features',
      { signal: expect.any(AbortSignal) }
    );
  });

  it('selects an embedded Flag Document with the supplied search function', async () => {
    // Prepare
    const document = { settings: { flags: { checkout: { default: true } } } };
    const envelopeSearchFn = vi.fn().mockReturnValue(document.settings.flags);
    fetchMock.mockResolvedValue(Response.json(document));
    const flags = new FeatureFlags({
      store: appConfigAgentStore({
        ...options,
        envelope: 'settings.flags',
        envelopeSearchFn,
      }),
    });
    // Act
    const result = await flags.evaluate({ name: 'checkout', default: false });
    // Assess
    expect(result).toBe(true);
    expect(envelopeSearchFn).toHaveBeenCalledExactlyOnceWith(
      'settings.flags',
      document
    );
  });

  it.each([{ envelope: 'secret-expression' }, { envelopeSearchFn: vi.fn() }])(
    'rejects incomplete envelope options %j before retrieval',
    (envelopeOptions) => {
      // Prepare
      const config = { ...options, ...envelopeOptions };
      // Act
      // @ts-expect-error Exercise JavaScript callers that supply only one envelope option.
      const act = () => appConfigAgentStore(config);
      // Assess
      expect(act).toThrow(FeatureFlagsError);
      expect(act).toThrow(
        "Options 'envelope' and 'envelopeSearchFn' must be provided together"
      );
      expect(act).not.toThrow('secret-expression');
      expect(fetchMock).not.toHaveBeenCalled();
    }
  );

  it('propagates a supplied search function error unchanged', async () => {
    // Prepare
    const error = new Error('search failed');
    const envelopeSearchFn = vi.fn(() => {
      throw error;
    });
    const flags = new FeatureFlags({
      store: appConfigAgentStore({
        ...options,
        envelope: 'settings.flags',
        envelopeSearchFn,
      }),
    });
    // Act
    const result = flags.evaluate({ name: 'checkout', default: false });
    // Assess
    await expect(result).rejects.toBe(error);
  });

  it.each([undefined, null])(
    'rejects an absent search result %j',
    async (selection) => {
      // Prepare
      const envelopeSearchFn = vi.fn().mockReturnValue(selection);
      const flags = new FeatureFlags({
        store: appConfigAgentStore({
          ...options,
          envelope: 'settings.flags',
          envelopeSearchFn,
        }),
      });
      // Act
      const result = flags.evaluate({ name: 'checkout', default: false });
      // Assess
      await expect(result).rejects.toBeInstanceOf(SchemaValidationError);
      await expect(result).rejects.toThrow(
        "Envelope 'settings.flags' did not select a Flag Document"
      );
    }
  );

  it.each([500, 503, 429])(
    'returns the Fallback for Agent status %i',
    async (status) => {
      // Prepare
      fetchMock.mockResolvedValue(new Response('opaque failure', { status }));
      const flags = new FeatureFlags({ store: appConfigAgentStore(options) });
      // Act
      const result = await flags.evaluate({ name: 'checkout', default: false });
      // Assess
      expect(result).toBe(false);
    }
  );

  it.each([400, 401, 403, 418])(
    'propagates Agent status %i',
    async (statusCode) => {
      // Prepare
      fetchMock.mockResolvedValue(
        new Response('configuration failure', { status: statusCode })
      );
      const flags = new FeatureFlags({ store: appConfigAgentStore(options) });
      // Act
      const result = flags.evaluate({ name: 'checkout', default: false });
      // Assess
      await expect(result).rejects.toBeInstanceOf(AppConfigAgentError);
      await expect(result).rejects.toHaveProperty('statusCode', statusCode);
    }
  );

  it('propagates a missing profile as ParameterNotFoundError', async () => {
    // Prepare
    fetchMock.mockResolvedValue(new Response('missing path', { status: 404 }));
    const flags = new FeatureFlags({ store: appConfigAgentStore(options) });
    // Act
    const result = flags.evaluate({ name: 'checkout', default: false });
    // Assess
    await expect(result).rejects.toBeInstanceOf(ParameterNotFoundError);
  });

  it('rethrows Parameters access denial unchanged', async () => {
    // Prepare
    const error = new AppConfigAgentError('denied', 403);
    fetchMock.mockRejectedValue(error);
    const flags = new FeatureFlags({ store: appConfigAgentStore(options) });
    // Act
    const result = flags.evaluate({ name: 'checkout', default: false });
    // Assess
    await expect(result).rejects.toBe(error);
  });

  it('returns the Fallback for a fetch network failure', async () => {
    // Prepare
    fetchMock.mockRejectedValue(new TypeError('fetch failed'));
    const flags = new FeatureFlags({ store: appConfigAgentStore(options) });
    // Act
    const result = await flags.evaluate({ name: 'checkout', default: false });
    // Assess
    expect(result).toBe(false);
  });

  it('returns the Fallback after a request timeout', async () => {
    // Prepare
    fetchMock.mockImplementation(
      (_url, init) =>
        new Promise((_resolve, reject) => {
          init?.signal?.addEventListener(
            'abort',
            () => reject(init.signal?.reason),
            { once: true }
          );
        })
    );
    const flags = new FeatureFlags({
      store: appConfigAgentStore({ ...options, timeout: 5 }),
    });
    // Act
    const result = await flags.evaluate({ name: 'checkout', default: false });
    // Assess
    expect(result).toBe(false);
  });

  it.each([
    { timeout: undefined, expected: 3000 },
    { timeout: 1000, expected: 1000 },
  ])('passes timeout $timeout to Parameters', async ({ timeout, expected }) => {
    // Prepare
    const timeoutSpy = vi.spyOn(AbortSignal, 'timeout');
    const store = appConfigAgentStore({ ...options, timeout });
    // Act
    await store.getAll({});
    // Assess
    expect(timeoutSpy).toHaveBeenCalledExactlyOnceWith(expected);
  });

  it('defaults application to POWERTOOLS_SERVICE_NAME', async () => {
    // Prepare
    vi.stubEnv('POWERTOOLS_SERVICE_NAME', 'service-app');
    const store = appConfigAgentStore({
      environment: 'prod',
      name: 'features',
    });
    // Act
    await store.getAll({});
    // Assess
    expect(fetchMock).toHaveBeenCalledExactlyOnceWith(
      'http://localhost:2772/applications/service-app/environments/prod/configurations/features',
      { signal: expect.any(AbortSignal) }
    );
  });

  it('propagates a missing application instead of returning the Fallback', async () => {
    // Prepare
    vi.stubEnv('POWERTOOLS_SERVICE_NAME', '');
    const flags = new FeatureFlags({
      store: appConfigAgentStore({ environment: 'prod', name: 'features' }),
    });
    // Act
    const result = flags.evaluate({ name: 'checkout', default: false });
    // Assess
    await expect(result).rejects.toBeInstanceOf(GetParameterError);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('propagates malformed JSON instead of returning the Fallback', async () => {
    // Prepare
    fetchMock.mockResolvedValue(new Response('not JSON'));
    const flags = new FeatureFlags({ store: appConfigAgentStore(options) });
    // Act
    const result = flags.evaluate({ name: 'checkout', default: false });
    // Assess
    await expect(result).rejects.toBeInstanceOf(TransformParameterError);
  });

  it('passes the logger through to the rule engine', async () => {
    // Prepare
    const logger = {
      debug: vi.fn(),
      warn: vi.fn(),
      info: vi.fn(),
      error: vi.fn(),
    };
    const store = appConfigAgentStore({ ...options, logger });
    // Act
    await new FeatureFlags({ store }).evaluate({
      name: 'checkout',
      default: false,
    });
    // Assess
    expect(logger.debug).toHaveBeenCalledExactlyOnceWith({
      store: 'rule-engine',
      name: 'checkout',
      outcome: 'default',
    });
    expect(logger.warn).not.toHaveBeenCalled();
  });
});

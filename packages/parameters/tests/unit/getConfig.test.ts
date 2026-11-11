import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { getConfig } from '../../src/appconfig-agent/index.js';
import {
  AppConfigAgentError,
  FlagNotFoundError,
  GetParameterError,
  ParameterNotFoundError,
  TransformParameterError,
} from '../../src/errors.js';
import type { AppConfigAgentRequestOptions } from '../../src/types/AppConfigAgent.js';

describe('Function: getConfig', () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    vi.stubEnv('POWERTOOLS_DEV', 'false');
    vi.stubEnv('AWS_LAMBDA_INITIALIZATION_TYPE', 'on-demand');
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it('returns undefined in dev mode', async () => {
    // Prepare
    vi.stubEnv('POWERTOOLS_DEV', 'true');

    // Act
    const result = await getConfig('my-config', {
      application: 'my-app',
      environment: 'my-env',
    });

    // Assess
    expect(result).toBeUndefined();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('returns undefined when not running in a Lambda environment', async () => {
    // Prepare
    vi.stubEnv('AWS_LAMBDA_INITIALIZATION_TYPE', undefined);

    // Act
    const result = await getConfig('my-config', {
      application: 'my-app',
      environment: 'my-env',
    });

    // Assess
    expect(result).toBeUndefined();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('throws a ParameterNotFoundError when not running in a Lambda environment, no local value is set, and throwOnMissing is set', async () => {
    // Prepare
    vi.stubEnv('AWS_LAMBDA_INITIALIZATION_TYPE', undefined);

    // Act & Assess
    await expect(
      getConfig('my-config', {
        application: 'my-app',
        environment: 'my-env',
        throwOnMissing: true,
      })
    ).rejects.toThrow(
      new ParameterNotFoundError('Configuration my-config not found')
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('returns the local value when not running in a Lambda environment', async () => {
    // Prepare
    vi.stubEnv('AWS_LAMBDA_INITIALIZATION_TYPE', undefined);
    vi.stubEnv('POWERTOOLS_APPCONFIG_AGENT_RETURN_VALUE', 'my-local-value');

    // Act
    const result = await getConfig('my-config', {
      application: 'my-app',
      environment: 'my-env',
    });

    // Assess
    expect(result).toBe('my-local-value');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('applies the transform to the local value when not running in a Lambda environment', async () => {
    // Prepare
    vi.stubEnv('AWS_LAMBDA_INITIALIZATION_TYPE', undefined);
    vi.stubEnv('POWERTOOLS_APPCONFIG_AGENT_RETURN_VALUE', '{"feature": true}');

    // Act
    const result = await getConfig('my-config', {
      application: 'my-app',
      environment: 'my-env',
      transform: 'json',
    });

    // Assess
    expect(result).toStrictEqual({ feature: true });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('fetches the configuration from the AppConfig Agent and returns it as a string', async () => {
    // Prepare
    fetchMock.mockResolvedValue({
      ok: true,
      text: vi.fn().mockResolvedValue('my-config-value'),
    });

    // Act
    const result = await getConfig('my-config', {
      application: 'my-app',
      environment: 'my-env',
    });

    // Assess
    expect(result).toBe('my-config-value');
    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:2772/applications/my-app/environments/my-env/configurations/my-config',
      expect.objectContaining({
        signal: expect.any(AbortSignal),
      })
    );
  });

  it('calls the AppConfig Agent on the port specified in the environment', async () => {
    // Prepare
    vi.stubEnv('AWS_APPCONFIG_EXTENSION_HTTP_PORT', '2773');
    fetchMock.mockResolvedValue({
      ok: true,
      text: vi.fn().mockResolvedValue('my-config-value'),
    });

    // Act
    await getConfig('my-config', {
      application: 'my-app',
      environment: 'my-env',
    });

    // Assess
    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:2773/applications/my-app/environments/my-env/configurations/my-config',
      expect.anything()
    );
  });

  it('falls back to the service name when the application is not provided', async () => {
    // Prepare
    vi.stubEnv('POWERTOOLS_SERVICE_NAME', 'my-service');
    fetchMock.mockResolvedValue({
      ok: true,
      text: vi.fn().mockResolvedValue('my-config-value'),
    });

    // Act
    await getConfig('my-config', {
      environment: 'my-env',
    });

    // Assess
    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:2772/applications/my-service/environments/my-env/configurations/my-config',
      expect.anything()
    );
  });

  it('throws when the application is not provided and the service name is not set', async () => {
    // Prepare
    vi.stubEnv('POWERTOOLS_SERVICE_NAME', undefined);

    // Act & Assess
    await expect(
      getConfig('my-config', {
        environment: 'my-env',
      })
    ).rejects.toThrow(
      new GetParameterError(
        'Application name is not defined or POWERTOOLS_SERVICE_NAME is not set'
      )
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('URL-encodes the path segments', async () => {
    // Prepare
    fetchMock.mockResolvedValue({
      ok: true,
      text: vi.fn().mockResolvedValue('my-config-value'),
    });

    // Act
    await getConfig('my config', {
      application: 'my app',
      environment: 'my/env',
    });

    // Assess
    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:2772/applications/my%20app/environments/my%2Fenv/configurations/my%20config',
      expect.anything()
    );
  });

  it.each([
    { flags: ['ui_refresh'], query: '?flag=ui_refresh' },
    { flags: ['ui_refresh', 'limit'], query: '?flag=ui_refresh&flag=limit' },
    {
      flags: ['ui_refresh', 'ui_refresh'],
      query: '?flag=ui_refresh&flag=ui_refresh',
    },
    {
      flags: ['a b&c=d?/#', 'café😀'],
      query: '?flag=a%20b%26c%3Dd%3F%2F%23&flag=caf%C3%A9%F0%9F%98%80',
    },
    { flags: [], query: '' },
  ])(
    'sends flags $flags as ordered query parameters',
    async ({ flags, query }) => {
      // Prepare
      fetchMock.mockResolvedValue(new Response('my-value'));

      // Act
      await getConfig('my config', {
        application: 'my app',
        environment: 'my/env',
        agentOptions: { flags },
      });

      // Assess
      expect(fetchMock).toHaveBeenCalledExactlyOnceWith(
        `http://localhost:2772/applications/my%20app/environments/my%2Fenv/configurations/my%20config${query}`,
        { signal: expect.any(AbortSignal) }
      );
    }
  );

  it.each<{
    label: string;
    context: Record<string, string | number | boolean>;
    expected: string;
  }>([
    {
      label: 'scalar values',
      context: { tier: 'pro', opted_in: true, limit: 10, label: 'a,b' },
      expected: 'tier="pro", opted_in=true, limit=10, label="a,b"',
    },
    {
      label: 'valid key punctuation and negative numbers',
      context: { '_tenant.id-1': 'tenant', enabled: false, limit: -1.5 },
      expected: '_tenant.id-1="tenant", enabled=false, limit=-1.5',
    },
    { label: 'equals', context: { label: 'a=b' }, expected: 'label="a=b"' },
    { label: 'quotes', context: { label: 'a"b' }, expected: 'label="a\\"b"' },
    { label: 'padding', context: { label: ' a ' }, expected: 'label=" a "' },
    { label: 'empty strings', context: { label: '' }, expected: 'label=""' },
    {
      label: 'Unicode and emoji',
      context: { label: 'café😀' },
      expected: 'label="caf\\u00e9\\ud83d\\ude00"',
    },
    {
      label: 'newlines and header injection',
      context: { label: 'a\r\nInjected: yes\n' },
      expected: 'label="a\\r\\nInjected: yes\\n"',
    },
    {
      label: 'entry injection',
      context: { label: '", injected=true, label="' },
      expected: 'label="\\", injected=true, label=\\""',
    },
    {
      label: 'backslashes and control characters',
      context: { label: '\\\t\0\u007f' },
      expected: 'label="\\\\\\t\\u0000\\u007f"',
    },
  ])(
    'encodes $label in one ASCII Context header',
    async ({ context, expected }) => {
      // Prepare
      fetchMock.mockResolvedValue(new Response('my-value'));

      // Act
      await getConfig('my-config', {
        application: 'my-app',
        environment: 'my-env',
        agentOptions: { context },
      });

      // Assess
      expect(fetchMock).toHaveBeenCalledExactlyOnceWith(
        'http://localhost:2772/applications/my-app/environments/my-env/configurations/my-config',
        { signal: expect.any(AbortSignal), headers: { Context: expected } }
      );
      const headers = new Headers(fetchMock.mock.calls[0][1].headers);
      expect([...headers]).toStrictEqual([['context', expected]]);
      const contextHeader: string = fetchMock.mock.calls[0][1].headers.Context;
      expect(contextHeader).not.toMatch(/[\r\n]/);
      expect(
        [...contextHeader].every((character) => character.charCodeAt(0) <= 0x7e)
      ).toBe(true);
    }
  );

  it('omits the Context header for empty context', async () => {
    // Prepare
    fetchMock.mockResolvedValue(new Response('my-value'));

    // Act
    await getConfig('my-config', {
      application: 'my-app',
      environment: 'my-env',
      agentOptions: { context: {} },
    });

    // Assess
    expect(fetchMock.mock.calls[0][1]).not.toHaveProperty('headers');
  });

  it.each([
    '',
    '1tier',
    '.tier',
    '-tier',
    ' tier',
    'tier ',
    'tier,value',
    'tier=value',
    'tier:value',
    'tier/value',
    'tier"',
    'tier\\',
    'tiér',
    'tier\t',
    'tier\r',
    'tier\n',
    'tier\r\nInjected: yes',
  ])('rejects context key %j before fetching', async (key) => {
    // Prepare
    const privateValue = 'distinctive-private-value';

    // Act
    const result = getConfig('my-config', {
      application: 'my-app',
      environment: 'my-env',
      agentOptions: { context: { [key]: privateValue } },
    });

    // Assess
    await expect(result).rejects.toSatisfy(
      (error: Error) =>
        error instanceof GetParameterError &&
        error.name === 'GetParameterError' &&
        error.message.includes(`"${key}"`) &&
        !error.message.includes(privateValue) &&
        !Object.hasOwn(error, 'cause')
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it.each([
    { kind: 'array', value: ['distinctive-private-value'] },
    { kind: 'object', value: { data: 'distinctive-private-value' } },
    { kind: 'null', value: null },
    { kind: 'undefined', value: undefined },
    { kind: 'NaN', value: Number.NaN },
    { kind: 'positive infinity', value: Number.POSITIVE_INFINITY },
    { kind: 'negative infinity', value: Number.NEGATIVE_INFINITY },
    { kind: 'bigint', value: 123456789n },
  ])('rejects a $kind context value before fetching', async ({ value }) => {
    // Prepare
    // Bypass the public scalar type to exercise validation for JavaScript callers.
    const context = {
      invalid_key: value,
    } as AppConfigAgentRequestOptions['context'];

    // Act
    const result = getConfig('my-config', {
      application: 'my-app',
      environment: 'my-env',
      agentOptions: { context },
    });

    // Assess
    await expect(result).rejects.toSatisfy(
      (error: Error) =>
        error instanceof GetParameterError &&
        error.name === 'GetParameterError' &&
        error.message.includes('invalid_key') &&
        !error.message.includes('distinctive-private-value') &&
        !error.message.includes(String(value)) &&
        !Object.hasOwn(error, 'cause')
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it.each(['', 123, false, null, undefined, [], {}])(
    'rejects invalid flag %j before fetching',
    async (flag) => {
      // Prepare
      // Bypass the public string array type to exercise validation for JavaScript callers.
      const flags = ['valid', flag] as string[];

      // Act
      const result = getConfig('my-config', {
        application: 'my-app',
        environment: 'my-env',
        agentOptions: { flags },
      });

      // Assess
      await expect(result).rejects.toSatisfy(
        (error: Error) =>
          error instanceof GetParameterError &&
          error.name === 'GetParameterError' &&
          error.message === 'Invalid flag at index 1' &&
          !Object.hasOwn(error, 'cause')
      );
      expect(fetchMock).not.toHaveBeenCalled();
    }
  );

  it.each([
    { status: 200, body: '' },
    {
      status: 400,
      // Observed with the official Agent 2.0.230173 image pinned in RFC #5614.
      body: '{"Details":{"Value":{"missing":{"Problem":"NoSuchFlag"}}},"Message":"Configuration data missing one or more flag values","Reason":"InvalidParameters"}',
    },
    {
      status: 400,
      body: '{"Details":{"Value":{"missing":{"Problem":"NoSuchFlag"},"also_missing":{"Problem":"NoSuchFlag"}}},"Reason":"InvalidParameters"}',
    },
  ])(
    'returns undefined for a missing flag with HTTP $status',
    async ({ status, body }) => {
      // Prepare
      fetchMock.mockResolvedValue(new Response(body, { status }));

      // Act
      const result = await getConfig('my-config', {
        application: 'my-app',
        environment: 'my-env',
        transform: 'json',
        agentOptions: { flags: ['missing', 'known_flag', 'also_missing'] },
      });

      // Assess
      expect(result).toBeUndefined();
    }
  );

  it.each([
    {
      status: 200,
      body: '',
      missingFlags: [
        'distinctive_missing_alpha',
        'known_flag',
        'distinctive_missing_omega',
      ],
    },
    {
      status: 400,
      body: '{"Details":{"Value":{"distinctive_missing_omega":{"Problem":"NoSuchFlag"},"distinctive_missing_alpha":{"Problem":"NoSuchFlag"}}},"Message":"Configuration data missing one or more flag values","Reason":"InvalidParameters"}',
      missingFlags: ['distinctive_missing_omega', 'distinctive_missing_alpha'],
    },
    {
      status: 400,
      body: '{"Details":{"Value":{"distinctive_missing_omega":{"Problem":"NoSuchFlag"},"known_flag":{"Problem":"DifferentCode"},"distinctive_missing_alpha":{"Problem":"NoSuchFlag"}}},"Reason":"InvalidParameters"}',
      missingFlags: ['distinctive_missing_omega', 'distinctive_missing_alpha'],
    },
  ])(
    'throws FlagNotFoundError with missing flag names for HTTP $status and throwOnMissing',
    async ({ status, body, missingFlags }) => {
      // Prepare
      fetchMock.mockResolvedValue(new Response(body, { status }));

      // Act
      const result = getConfig('my-config', {
        application: 'my-app',
        environment: 'my-env',
        agentOptions: {
          flags: [
            'distinctive_missing_alpha',
            'known_flag',
            'distinctive_missing_omega',
          ],
        },
        throwOnMissing: true,
      });

      // Assess
      await expect(result).rejects.toBeInstanceOf(FlagNotFoundError);
      await expect(result).rejects.toMatchObject({
        name: 'FlagNotFoundError',
        message: 'One or more flags not found in configuration my-config',
        flags: missingFlags,
      });
      await expect(result).rejects.toSatisfy(
        (error: Error) =>
          !error.message.includes('distinctive_missing') &&
          !Object.hasOwn(error, 'cause')
      );
    }
  );

  it.each(
    [
      { scenario: 'partial', body: '{"a":{"enabled":true}}' },
      { scenario: 'all unknown', body: '{}' },
    ].flatMap((testCase) =>
      ([undefined, 'json', 'binary'] as const).map((transform) => ({
        ...testCase,
        transform,
      }))
    )
  )(
    'returns undefined for $scenario multi-flag responses with transform $transform',
    async ({ body, transform }) => {
      // Prepare
      fetchMock.mockResolvedValue(new Response(body));

      // Act
      const result = await getConfig('my-config', {
        application: 'my-app',
        environment: 'my-env',
        agentOptions: { flags: ['a', 'b'] },
        transform,
      });

      // Assess
      expect(result).toBeUndefined();
    }
  );

  it.each(
    [
      {
        scenario: 'partial',
        body: '{"a":{"enabled":true}}',
        missingFlags: ['b'],
      },
      { scenario: 'all unknown', body: '{}', missingFlags: ['a', 'b'] },
    ].flatMap((testCase) =>
      ([undefined, 'json', 'binary'] as const).map((transform) => ({
        ...testCase,
        transform,
      }))
    )
  )(
    'throws FlagNotFoundError for $scenario multi-flag responses with transform $transform',
    async ({ body, missingFlags, transform }) => {
      // Prepare
      fetchMock.mockResolvedValue(new Response(body));

      // Act
      const result = getConfig('my-config', {
        application: 'my-app',
        environment: 'my-env',
        agentOptions: { flags: ['a', 'b'] },
        transform,
        throwOnMissing: true,
      });

      // Assess
      await expect(result).rejects.toBeInstanceOf(FlagNotFoundError);
      await expect(result).rejects.toMatchObject({
        message: 'One or more flags not found in configuration my-config',
        flags: missingFlags,
      });
    }
  );

  it('returns the original body for complete multi-flag responses', async () => {
    // Prepare
    const body = '\n{ "b": {"enabled": false}, "a": {"enabled": true} }\n';
    fetchMock.mockResolvedValue(new Response(body));

    // Act
    const result = await getConfig('my-config', {
      application: 'my-app',
      environment: 'my-env',
      agentOptions: { flags: ['a', 'b'] },
      throwOnMissing: true,
    });

    // Assess
    expect(result).toBe(body);
  });

  it('applies the JSON transform to complete multi-flag responses', async () => {
    // Prepare
    const body = '\n{ "b": {"enabled": false}, "a": {"enabled": true} }\n';
    fetchMock.mockResolvedValue(new Response(body));

    // Act
    const result = await getConfig('my-config', {
      application: 'my-app',
      environment: 'my-env',
      agentOptions: { flags: ['a', 'b'] },
      transform: 'json',
      throwOnMissing: true,
    });

    // Assess
    expect(result).toStrictEqual({
      a: { enabled: true },
      b: { enabled: false },
    });
  });

  it.each([
    'not JSON',
    '[{"a":{"enabled":true}}]',
    'null',
    'true',
    '123',
    '"value"',
  ])('preserves non-object multi-flag response %s', async (body) => {
    // Prepare
    fetchMock.mockResolvedValue(new Response(body));

    // Act
    const result = await getConfig('my-config', {
      application: 'my-app',
      environment: 'my-env',
      agentOptions: { flags: ['a', 'b'] },
      throwOnMissing: true,
    });

    // Assess
    expect(result).toBe(body);
  });

  it('reports duplicate missing multi-flag names once in request order', async () => {
    // Prepare
    fetchMock.mockResolvedValue(new Response('{"a":{"enabled":true}}'));

    // Act
    const result = getConfig('my-config', {
      application: 'my-app',
      environment: 'my-env',
      agentOptions: { flags: ['a', 'c', 'b', 'c', 'b'] },
      throwOnMissing: true,
    });

    // Assess
    await expect(result).rejects.toBeInstanceOf(FlagNotFoundError);
    await expect(result).rejects.toMatchObject({ flags: ['c', 'b'] });
  });

  it('ignores inherited property names in multi-flag responses', async () => {
    // Prepare
    fetchMock.mockResolvedValue(new Response('{"a":{"enabled":true}}'));

    // Act
    const result = getConfig('my-config', {
      application: 'my-app',
      environment: 'my-env',
      agentOptions: { flags: ['a', 'toString', 'constructor', '__proto__'] },
      throwOnMissing: true,
    });

    // Assess
    await expect(result).rejects.toBeInstanceOf(FlagNotFoundError);
    await expect(result).rejects.toMatchObject({
      flags: ['toString', 'constructor', '__proto__'],
    });
  });

  it.each(['not JSON', '{"enabled":true}', '{}', '[]'])(
    'returns a single-flag response %s without parsing',
    async (body) => {
      // Prepare
      fetchMock.mockResolvedValue(new Response(body));
      const parseSpy = vi.spyOn(JSON, 'parse');

      try {
        // Act
        const result = await getConfig('my-config', {
          application: 'my-app',
          environment: 'my-env',
          agentOptions: { flags: ['a'] },
          throwOnMissing: true,
        });

        // Assess
        expect(result).toBe(body);
        expect(parseSpy).not.toHaveBeenCalled();
      } finally {
        parseSpy.mockRestore();
      }
    }
  );

  it.each([
    'not JSON',
    'null',
    '[]',
    '{}',
    '{"Reason":"DifferentCode","Details":{"Value":{"missing":{"Problem":"NoSuchFlag"}}}}',
    '{"Reason":"InvalidParameters"}',
    '{"Reason":"InvalidParameters","Details":null}',
    '{"Reason":"InvalidParameters","Details":{}}',
    '{"Reason":"InvalidParameters","Details":{"Value":[]}}',
    '{"Reason":"InvalidParameters","Details":{"Value":{}}}',
    '{"Reason":"InvalidParameters","Details":{"Value":{"missing":null}}}',
    '{"Reason":"InvalidParameters","Details":{"Value":{"missing":{"Problem":"DifferentCode"}}}}',
    '{"Message":"NoSuchFlag"}',
  ])(
    'preserves HTTP 400 errors for unrelated or malformed body %s',
    async (body) => {
      // Prepare
      fetchMock.mockResolvedValue(new Response(body, { status: 400 }));

      // Act
      const result = getConfig('my-config', {
        application: 'my-app',
        environment: 'my-env',
        agentOptions: { flags: ['missing'] },
      });

      // Assess
      await expect(result).rejects.toBeInstanceOf(AppConfigAgentError);
      await expect(result).rejects.toMatchObject({ statusCode: 400 });
    }
  );

  it.each([undefined, {}, { flags: [] }, { context: { tier: 'pro' } }])(
    'preserves NoSuchFlag errors without selective flags %j',
    async (agentOptions) => {
      // Prepare
      fetchMock.mockResolvedValue(
        new Response(
          '{"Details":{"Value":{"missing":{"Problem":"NoSuchFlag"}}},"Reason":"InvalidParameters"}',
          { status: 400 }
        )
      );

      // Act
      const result = getConfig('my-config', {
        application: 'my-app',
        environment: 'my-env',
        agentOptions,
      });

      // Assess
      await expect(result).rejects.toBeInstanceOf(AppConfigAgentError);
      await expect(result).rejects.toMatchObject({ statusCode: 400 });
    }
  );

  it.each([undefined, {}, { flags: [] }, { context: { tier: 'pro' } }])(
    'returns an empty HTTP 200 body without selective flags %j',
    async (agentOptions) => {
      // Prepare
      fetchMock.mockResolvedValue(new Response(''));

      // Act
      const result = await getConfig('my-config', {
        application: 'my-app',
        environment: 'my-env',
        agentOptions,
        throwOnMissing: true,
      });

      // Assess
      expect(result).toBe('');
    }
  );

  it('preserves JSON transform errors for an empty HTTP 200 body without flags', async () => {
    // Prepare
    fetchMock.mockResolvedValue(new Response(''));

    // Act
    const result = getConfig('my-config', {
      application: 'my-app',
      environment: 'my-env',
      transform: 'json',
    });

    // Assess
    await expect(result).rejects.toBeInstanceOf(TransformParameterError);
  });

  it('applies the binary transform to an empty HTTP 200 body without flags', async () => {
    // Prepare
    fetchMock.mockResolvedValue(new Response(''));

    // Act
    const result = await getConfig('my-config', {
      application: 'my-app',
      environment: 'my-env',
      transform: 'binary',
    });

    // Assess
    expect(result).toBe('');
  });

  it('retrieves a flag with caller context', async () => {
    // Prepare
    fetchMock.mockResolvedValue(new Response('{"enabled":true}'));

    // Act
    const result = await getConfig('my-config', {
      application: 'my-app',
      environment: 'my-env',
      transform: 'json',
      agentOptions: { flags: ['ui_refresh'], context: { tier: 'pro' } },
    });

    // Assess
    expect(result).toStrictEqual({ enabled: true });
    expect(fetchMock).toHaveBeenCalledExactlyOnceWith(
      'http://localhost:2772/applications/my-app/environments/my-env/configurations/my-config?flag=ui_refresh',
      { signal: expect.any(AbortSignal), headers: { Context: 'tier="pro"' } }
    );
  });

  it.each([401, 403, 500, 503])(
    'preserves HTTP %i errors with flags',
    async (status) => {
      // Prepare
      fetchMock.mockResolvedValue(new Response('{"enabled":true}', { status }));

      // Act
      const result = getConfig('my-config', {
        application: 'my-app',
        environment: 'my-env',
        agentOptions: {
          flags: ['ui_refresh', 'another_flag'],
          context: { tier: 'pro' },
        },
      });

      // Assess
      await expect(result).rejects.toBeInstanceOf(AppConfigAgentError);
      await expect(result).rejects.toMatchObject({ statusCode: status });
    }
  );

  it.each(['outside Lambda', 'dev mode'])(
    'ignores agentOptions in %s',
    async (mode) => {
      // Prepare
      vi.stubEnv(
        'AWS_LAMBDA_INITIALIZATION_TYPE',
        mode === 'outside Lambda' ? undefined : 'on-demand'
      );
      vi.stubEnv('POWERTOOLS_DEV', mode === 'dev mode' ? 'true' : 'false');
      vi.stubEnv(
        'POWERTOOLS_APPCONFIG_AGENT_RETURN_VALUE',
        '{"all_flags":true}'
      );

      // Act
      const result = await getConfig('my-config', {
        application: 'my-app',
        environment: 'my-env',
        transform: 'json',
        agentOptions: {
          flags: ['missing', 'also_missing'],
          context: { tier: 'pro' },
        },
      });

      // Assess
      expect(result).toStrictEqual({ all_flags: true });
      expect(fetchMock).not.toHaveBeenCalled();
    }
  );

  it.each<AppConfigAgentRequestOptions>([
    { flags: [''] },
    { context: { 'invalid key': 'private-value' } },
    { context: { limit: Number.NaN } },
  ])('validates agentOptions %j in local mode', async (agentOptions) => {
    // Prepare
    vi.stubEnv('AWS_LAMBDA_INITIALIZATION_TYPE', undefined);
    vi.stubEnv('POWERTOOLS_APPCONFIG_AGENT_RETURN_VALUE', 'my-local-value');

    // Act
    const result = getConfig('my-config', {
      application: 'my-app',
      environment: 'my-env',
      agentOptions,
    });

    // Assess
    await expect(result).rejects.toBeInstanceOf(GetParameterError);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('applies the json transform to the configuration', async () => {
    // Prepare
    fetchMock.mockResolvedValue({
      ok: true,
      text: vi.fn().mockResolvedValue('{"feature": true}'),
    });

    // Act
    const result = await getConfig('my-config', {
      application: 'my-app',
      environment: 'my-env',
      transform: 'json',
    });

    // Assess
    expect(result).toStrictEqual({ feature: true });
  });

  it('throws when the json transform fails', async () => {
    // Prepare
    fetchMock.mockResolvedValue({
      ok: true,
      text: vi.fn().mockResolvedValue('not-json'),
    });

    // Act & Assess
    await expect(
      getConfig('my-config', {
        application: 'my-app',
        environment: 'my-env',
        transform: 'json',
      })
    ).rejects.toThrow(TransformParameterError);
  });

  it('applies the binary transform to the configuration', async () => {
    // Prepare
    fetchMock.mockResolvedValue({
      ok: true,
      text: vi
        .fn()
        .mockResolvedValue(Buffer.from('my-value').toString('base64')),
    });

    // Act
    const result = await getConfig('my-config', {
      application: 'my-app',
      environment: 'my-env',
      transform: 'binary',
    });

    // Assess
    expect(result).toBe('my-value');
  });

  it.each([undefined, { flags: ['distinctive_missing_flag'] }])(
    'returns undefined for a missing configuration with agentOptions %j',
    async (agentOptions) => {
      // Prepare
      fetchMock.mockResolvedValue({
        ok: false,
        status: 404,
        text: vi
          .fn()
          .mockResolvedValue(
            '{"Message":"Unrecognized or malformed path","ResourceType":"Configuration"}'
          ),
      });

      // Act
      const result = await getConfig('my-config', {
        application: 'my-app',
        environment: 'my-env',
        agentOptions,
      });

      // Assess
      expect(result).toBeUndefined();
    }
  );

  it.each([undefined, { flags: ['distinctive_missing_flag'] }])(
    'throws plain ParameterNotFoundError for a missing configuration with agentOptions %j and throwOnMissing',
    async (agentOptions) => {
      // Prepare
      fetchMock.mockResolvedValue({
        ok: false,
        status: 404,
        text: vi
          .fn()
          .mockResolvedValue(
            '{"Message":"Unrecognized or malformed path","ResourceType":"Configuration"}'
          ),
      });

      // Act
      const result = getConfig('my-config', {
        application: 'my-app',
        environment: 'my-env',
        agentOptions,
        throwOnMissing: true,
      });

      // Assess
      await expect(result).rejects.toThrow(
        new ParameterNotFoundError('Configuration my-config not found')
      );
      await expect(result).rejects.toBeInstanceOf(ParameterNotFoundError);
      await expect(result).rejects.not.toBeInstanceOf(FlagNotFoundError);
      await expect(result).rejects.toMatchObject({
        name: 'ParameterNotFoundError',
      });
    }
  );

  it('throws when the AppConfig Agent responds with an error', async () => {
    // Prepare
    fetchMock.mockResolvedValue({
      ok: false,
      status: 500,
      text: vi.fn().mockResolvedValue('Internal Server Error'),
    });

    // Act
    const result = getConfig('my-config', {
      application: 'my-app',
      environment: 'my-env',
    });

    // Assess
    await expect(result).rejects.toSatisfy(
      (error: Error) =>
        error instanceof GetParameterError &&
        error.message ===
          'Failed to retrieve configuration from AppConfig Agent: 500 Internal Server Error'
    );
  });

  it.each([400, 401, 403, 500, 503])(
    'exposes HTTP status %i in an AppConfigAgentError',
    async (statusCode) => {
      // Prepare
      fetchMock.mockResolvedValue({
        ok: false,
        status: statusCode,
        text: vi.fn().mockResolvedValue('Agent error'),
      });

      // Act
      const result = getConfig('my-config', {
        application: 'my-app',
        environment: 'my-env',
      });

      // Assess
      await expect(result).rejects.toBeInstanceOf(AppConfigAgentError);
      await expect(result).rejects.toBeInstanceOf(GetParameterError);
      await expect(result).rejects.toMatchObject({
        statusCode,
        message: `Failed to retrieve configuration from AppConfig Agent: ${statusCode} Agent error`,
        name: 'AppConfigAgentError',
      });
    }
  );

  it('wraps network errors in a GetParameterError', async () => {
    // Prepare
    const networkError = new Error('fetch failed');
    fetchMock.mockRejectedValue(networkError);

    // Act & Assess
    await expect(
      getConfig('my-config', {
        application: 'my-app',
        environment: 'my-env',
      })
    ).rejects.toSatisfy(
      (error: Error) =>
        error instanceof GetParameterError &&
        !(error instanceof AppConfigAgentError) &&
        error.name === 'GetParameterError' &&
        error.message === 'fetch failed' &&
        error.cause === networkError
    );
  });

  it.each([
    { case: 'default', timeout: undefined, expected: 3000 },
    { case: 'custom', timeout: 5000, expected: 5000 },
  ])(
    'uses the $case timeout when calling the AppConfig Agent',
    async ({ timeout, expected }) => {
      // Prepare
      const timeoutSpy = vi
        .spyOn(AbortSignal, 'timeout')
        .mockReturnValue(new AbortController().signal);
      fetchMock.mockResolvedValue({
        ok: true,
        text: vi.fn().mockResolvedValue('my-config-value'),
      });

      // Act
      await getConfig('my-config', {
        application: 'my-app',
        environment: 'my-env',
        timeout,
      });

      // Assess
      expect(timeoutSpy).toHaveBeenCalledWith(expected);

      timeoutSpy.mockRestore();
    }
  );

  it('wraps a timed out request in a GetParameterError', async () => {
    // Prepare
    // Reject when the signal aborts, like the real fetch does; the request itself never resolves
    fetchMock.mockImplementation(
      (_url: string, { signal }: { signal: AbortSignal }) =>
        new Promise((_, reject) => {
          signal.addEventListener('abort', () => reject(signal.reason), {
            once: true,
          });
        })
    );

    // Act & Assess
    await expect(
      getConfig('my-config', {
        application: 'my-app',
        environment: 'my-env',
        timeout: 1,
      })
    ).rejects.toSatisfy(
      (error: Error) =>
        error instanceof GetParameterError &&
        (error.cause as Error).name === 'TimeoutError'
    );
  });
});

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { getConfig } from '../../src/appconfig-agent/index.js';
import {
  GetParameterError,
  ParameterNotFoundError,
  TransformParameterError,
} from '../../src/errors.js';

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

  it('throws a ParameterNotFoundError when the configuration does not exist', async () => {
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

    // Act & Assess
    await expect(
      getConfig('my-config', {
        application: 'my-app',
        environment: 'my-env',
      })
    ).rejects.toThrow(
      new ParameterNotFoundError('Configuration my-config not found')
    );
  });

  it('throws when the AppConfig Agent responds with an error', async () => {
    // Prepare
    fetchMock.mockResolvedValue({
      ok: false,
      status: 500,
      text: vi.fn().mockResolvedValue('Internal Server Error'),
    });

    // Act & Assess
    await expect(
      getConfig('my-config', {
        application: 'my-app',
        environment: 'my-env',
      })
    ).rejects.toThrow(
      new GetParameterError(
        'Failed to retrieve configuration from AppConfig Agent: 500 Internal Server Error'
      )
    );
  });

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
        error.message === 'fetch failed' &&
        error.cause === networkError
    );
  });

  it.each([
    { case: 'default', timeout: undefined, expected: 3000 },
    { case: 'custom', timeout: 5000, expected: 5000 },
  ])('uses the $case timeout when calling the AppConfig Agent', async ({
    timeout,
    expected,
  }) => {
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
  });

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

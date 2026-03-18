import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { clearMetadataCache, getMetadata } from '../../src/metadata.js';

describe('Function: getMetadata', () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    clearMetadataCache();
    fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it('returns an empty object in dev mode', async () => {
    // Prepare
    vi.stubEnv('POWERTOOLS_DEV', 'true');
    // Act
    const result = await getMetadata();

    // Assess
    expect(result).toEqual({});
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('returns an empty object when initialization type is unknown', async () => {
    // Prepare
    vi.stubEnv('POWERTOOLS_DEV', 'false');
    vi.stubEnv('AWS_LAMBDA_INITIALIZATION_TYPE', undefined);
    // Act
    const result = await getMetadata();

    // Assess
    expect(result).toEqual({});
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('fetches metadata and caches the response', async () => {
    // Prepare
    vi.stubEnv('POWERTOOLS_DEV', 'false');
    vi.stubEnv('AWS_LAMBDA_INITIALIZATION_TYPE', 'on-demand');
    vi.stubEnv('AWS_LAMBDA_METADATA_API', '127.0.0.1:1234');
    vi.stubEnv('AWS_LAMBDA_METADATA_TOKEN', 'test-token');

    const payload = { runtime: 'nodejs20.x' };
    fetchMock.mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue(payload),
    });

    // Act
    const resultA = await getMetadata();
    const resultB = await getMetadata();

    // Assess
    expect(resultA).toEqual(payload);
    expect(resultB).toBe(resultA);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith(
      'http://127.0.0.1:1234/2026-01-15/metadata/execution-environment',
      expect.objectContaining({
        headers: {
          Authorization: 'Bearer test-token',
        },
        signal: expect.any(AbortSignal),
      })
    );
  });

  it('throws an error when the metadata endpoint responds with an error', async () => {
    // Prepare
    vi.stubEnv('POWERTOOLS_DEV', 'false');
    vi.stubEnv('AWS_LAMBDA_INITIALIZATION_TYPE', 'on-demand');
    vi.stubEnv('AWS_LAMBDA_METADATA_API', '127.0.0.1:1234');
    vi.stubEnv('AWS_LAMBDA_METADATA_TOKEN', 'test-token');

    fetchMock.mockResolvedValue({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
    });

    // Act & Assess
    await expect(getMetadata()).rejects.toThrow(
      'Failed to fetch execution environment metadata: 500 Internal Server Error'
    );
  });
});

import {
  clearMetadataCache,
  getMetadata,
} from '@aws-lambda-powertools/commons/utils/metadata';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

describe('function: getMetadata', async () => {
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

  it('fetches metadata and caches the response', async () => {
    // Prepare
    vi.stubEnv('AWS_LAMBDA_INITIALIZATION_TYPE', 'on-demand');
    vi.stubEnv('AWS_LAMBDA_METADATA_API', '127.0.0.1:1234');
    vi.stubEnv('AWS_LAMBDA_METADATA_TOKEN', 'test-token');

    const payload = { runtime: 'nodejs22.x' };
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
});

import { describe, expect, it, vi } from 'vitest';
import { createSignedFetcher } from '../../src/fetch.js';
import type { Signer } from '../../src/types/index.js';

describe('Function: createSignedFetcher', () => {
  const makeSigner = (): Signer => ({
    sign: vi.fn(async (input, init) => {
      const request = new Request(input as string | URL | Request, init);
      const headers = new Headers(request.headers);
      headers.set('authorization', 'AWS4-HMAC-SHA256 signed');
      return new Request(request.url, {
        method: request.method,
        headers,
      });
    }),
  });

  it('signs the request before sending it', async () => {
    // Prepare
    const signer = makeSigner();
    const fetchImpl = vi.fn(async (_request: Request) => new Response('ok'));
    const signedFetch = createSignedFetcher(signer, {
      fetch: fetchImpl as unknown as typeof fetch,
    });

    // Act
    await signedFetch('https://example.com/items');

    // Assess
    expect(signer.sign).toHaveBeenCalledTimes(1);
    const sentRequest = fetchImpl.mock.calls[0]?.[0] as Request;
    expect(sentRequest.headers.get('authorization')).toBe(
      'AWS4-HMAC-SHA256 signed'
    );
  });

  it('returns the response from the underlying fetch', async () => {
    // Prepare
    const signer = makeSigner();
    const fetchImpl = vi.fn(async () => new Response('payload'));
    const signedFetch = createSignedFetcher(signer, { fetch: fetchImpl });

    // Act
    const response = await signedFetch('https://example.com/items');

    // Assess
    expect(await response.text()).toBe('payload');
  });

  it('uses the global fetch when no custom fetch is provided', async () => {
    // Prepare
    const signer = makeSigner();
    const globalFetch = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(new Response('from global'));
    const signedFetch = createSignedFetcher(signer);

    // Act
    const response = await signedFetch('https://example.com/items');

    // Assess
    expect(globalFetch).toHaveBeenCalledTimes(1);
    expect(await response.text()).toBe('from global');
  });

  it('propagates transport errors from the underlying fetch untouched', async () => {
    // Prepare
    const signer = makeSigner();
    const transportError = new Error('network down');
    const fetchImpl = vi.fn(async () => {
      throw transportError;
    });
    const signedFetch = createSignedFetcher(signer, { fetch: fetchImpl });

    // Act & Assess
    await expect(signedFetch('https://example.com/items')).rejects.toBe(
      transportError
    );
  });

  it('forwards the request init to the signer', async () => {
    // Prepare
    const signer = makeSigner();
    const fetchImpl = vi.fn(async () => new Response('ok'));
    const signedFetch = createSignedFetcher(signer, { fetch: fetchImpl });

    // Act
    await signedFetch('https://example.com/items', { method: 'POST' });

    // Assess
    expect(signer.sign).toHaveBeenCalledWith('https://example.com/items', {
      method: 'POST',
    });
  });
});

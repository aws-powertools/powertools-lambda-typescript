import { describe, expect, it, vi } from 'vitest';
import { createSignedFetcher } from '../../src/fetch.js';
import { SigV4Signer } from '../../src/sigv4.js';

/**
 * Creates a signer with static credentials for request-options tests.
 */
const createSigner = (): SigV4Signer =>
  new SigV4Signer({
    service: 'execute-api',
    region: 'us-east-1',
    credentials: {
      accessKeyId: 'EXAMPLE',
      secretAccessKey: 'example-secret',
    },
  });

describe('SigV4Signer request options', () => {
  it.each(['string', 'URL', 'Request'] as const)(
    'preserves fetch options supplied through %s input',
    async (kind) => {
      // Prepare
      const signer = createSigner();
      const url = new URL('https://example.com/items');
      const options: RequestInit = {
        cache: 'no-store',
        credentials: 'omit',
        integrity: 'sha256-example',
        keepalive: true,
        mode: 'same-origin',
        redirect: 'manual',
        referrer: 'https://origin.example/',
        referrerPolicy: 'no-referrer',
      };
      const input = kind === 'Request' ? new Request(url, options) : url;

      // Act
      const signed =
        kind === 'Request'
          ? await signer.sign(input)
          : await signer.sign(kind === 'string' ? url.href : url, options);

      // Assess
      expect(signed.cache).toBe('no-store');
      expect(signed.credentials).toBe('omit');
      expect(signed.integrity).toBe('sha256-example');
      expect(signed.keepalive).toBe(true);
      expect(signed.mode).toBe('same-origin');
      expect(signed.redirect).toBe('manual');
      expect(signed.referrer).toBe('https://origin.example/');
      expect(signed.referrerPolicy).toBe('no-referrer');
      expect(signed.headers.get('authorization')).toContain('AWS4-HMAC-SHA256');
    }
  );

  it('preserves init overrides on a Request input', async () => {
    // Prepare
    const signer = createSigner();
    const request = new Request('https://example.com/items', {
      redirect: 'manual',
      cache: 'no-store',
      referrer: 'https://original.example/',
      referrerPolicy: 'no-referrer',
    });

    // Act
    const signed = await signer.sign(request, {
      redirect: 'error',
      cache: 'reload',
      referrer: 'https://override.example/',
      referrerPolicy: 'origin',
    });

    // Assess
    expect(signed.redirect).toBe('error');
    expect(signed.cache).toBe('reload');
    expect(signed.referrer).toBe('https://override.example/');
    expect(signed.referrerPolicy).toBe('origin');
  });

  it('preserves a pre-aborted signal and its reason', async () => {
    // Prepare
    const signer = createSigner();
    const controller = new AbortController();
    const reason = new Error('cancelled');
    controller.abort(reason);

    // Act
    const signed = await signer.sign('https://example.com/items', {
      signal: controller.signal,
    });

    // Assess
    expect(signed.signal.aborted).toBe(true);
    expect(signed.signal.reason).toBe(reason);
  });

  it('inherits referrer settings when init contains undefined values', async () => {
    // Prepare
    const signer = createSigner();
    const request = new Request('https://example.com/items', {
      referrer: 'https://origin.example/',
      referrerPolicy: 'no-referrer',
    });

    // Act
    const signed = await signer.sign(request, {
      referrer: undefined,
      referrerPolicy: undefined,
    });

    // Assess
    expect(signed.referrer).toBe('https://origin.example/');
    expect(signed.referrerPolicy).toBe('no-referrer');
  });

  it('propagates aborts after signing a Request input', async () => {
    // Prepare
    const signer = createSigner();
    const controller = new AbortController();
    const request = new Request('https://example.com/items', {
      signal: controller.signal,
    });
    const reason = new Error('cancelled after signing');

    // Act
    const signed = await signer.sign(request);
    controller.abort(reason);

    // Assess
    expect(signed.signal.aborted).toBe(true);
    expect(signed.signal.reason).toBe(reason);
  });

  it('uses the override signal instead of the Request signal', async () => {
    // Prepare
    const signer = createSigner();
    const originalController = new AbortController();
    const overrideController = new AbortController();
    const request = new Request('https://example.com/items', {
      signal: originalController.signal,
    });

    // Act
    const signed = await signer.sign(request, {
      signal: overrideController.signal,
    });
    originalController.abort();

    // Assess
    expect(signed.signal.aborted).toBe(false);
    overrideController.abort();
    expect(signed.signal.aborted).toBe(true);
    expect(signed.signal.reason).toBe(overrideController.signal.reason);
  });

  it('passes redirect settings and cancellation to the signed fetcher transport', async () => {
    // Prepare
    const signer = createSigner();
    const controller = new AbortController();
    const transport = vi
      .fn<typeof fetch>()
      .mockResolvedValue(new Response('ok'));
    const signedFetch = createSignedFetcher(signer, { fetch: transport });

    // Act
    await signedFetch('https://example.com/items', {
      redirect: 'error',
      signal: controller.signal,
    });
    controller.abort();

    // Assess
    const [sent] = transport.mock.calls[0];
    expect(sent).toBeInstanceOf(Request);
    if (sent instanceof Request) {
      expect(sent.redirect).toBe('error');
      expect(sent.signal.aborted).toBe(true);
      expect(sent.signal.reason).toBe(controller.signal.reason);
    }
  });

  it('keeps a replacement body usable on a consumed Request', async () => {
    // Prepare
    const signer = createSigner();
    const request = new Request('https://example.com/items', {
      method: 'POST',
      body: 'original',
    });
    await request.text();

    // Act
    const signed = await signer.sign(request, {
      body: 'replacement',
      redirect: 'manual',
    });

    // Assess
    expect(await signed.text()).toBe('replacement');
    expect(signed.redirect).toBe('manual');
  });
});

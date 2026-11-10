import { createHash } from 'node:crypto';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { RequestSigningError, SignerConfigError } from '../../src/errors.js';
import { createSignedFetcher } from '../../src/fetch.js';
import { SigV4aSigner } from '../../src/sigv4a.js';
import { credentials, verifySignature } from '../helpers/signature.js';

describe('Class: SigV4aSigner', () => {
  beforeEach(() => {
    vi.stubEnv('AWS_REGION', undefined);
    vi.stubEnv('AWS_ACCESS_KEY_ID', credentials.accessKeyId);
    vi.stubEnv('AWS_SECRET_ACCESS_KEY', credentials.secretAccessKey);
    vi.stubEnv('AWS_SESSION_TOKEN', undefined);
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-02T03:04:05Z'));
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it.each([['us-east-1', 'us-west-2'], ['*'], ['us-west-*']])(
    'signs for the configured region set %j without AWS_REGION',
    async (...regionSet) => {
      // Prepare
      const signer = new SigV4aSigner({ service: 's3', regionSet });

      // Act
      const signed = await signer.sign(
        'https://example.accesspoint.s3-global.amazonaws.com/object'
      );

      // Assess
      expect(signed.headers.get('authorization')).toContain(
        'AWS4-ECDSA-P256-SHA256 Credential=AKIDEXAMPLE/20260102/s3/aws4_request'
      );
      expect(signed.headers.get('authorization')).toContain('x-amz-region-set');
      expect(signed.headers.get('x-amz-region-set')).toBe(regionSet.join(','));
      expect(signed.headers.get('x-amz-date')).toBe('20260102T030405Z');
      expect(signed.headers.get('x-amz-content-sha256')).toBe(
        createHash('sha256').update('').digest('hex')
      );
      expect(await verifySignature(signed, '/object')).toBe(true);
    }
  );

  it.each([
    [],
    [''],
    [' '],
    ['us-east-1', ''],
    ['us-east-1,us-west-2'],
    ['us-east-1\n'],
    ['-'],
    ['us--east-1'],
  ])('rejects invalid region sets %j', (...regionSet) => {
    // Prepare & Act & Assess
    expect(() => new SigV4aSigner({ service: 's3', regionSet })).toThrow(
      SignerConfigError
    );
  });

  it('keeps the configured region set when the input array changes', async () => {
    // Prepare
    const regionSet = ['us-east-1'];
    const signer = new SigV4aSigner({ service: 's3', regionSet });
    regionSet.push('us-west-2');

    // Act
    const signed = await signer.sign('https://example.com/object');

    // Assess
    expect(signed.headers.get('x-amz-region-set')).toBe('us-east-1');
  });

  it.each([
    { service: 's3', path: '/folder//object%20name' },
    { service: 'execute-api', path: '/folder/object%2520name' },
  ])(
    'uses the canonical path rules for $service',
    async ({ service, path }) => {
      // Prepare
      const signer = new SigV4aSigner({ service, regionSet: ['*'] });

      // Act
      const signed = await signer.sign(
        'https://example.com/folder//object%20name'
      );

      // Assess
      expect(await verifySignature(signed, path)).toBe(true);
    }
  );

  it('signs query parameters and preserves their URL', async () => {
    // Prepare
    const signer = new SigV4aSigner({ service: 's3', regionSet: ['*'] });
    const url = 'https://example.com:8443/object?foo=bar&baz=qux';

    // Act
    const signed = await signer.sign(new URL(url));

    // Assess
    expect(signed.url).toBe(url);
    expect(signed.headers.get('host')).toBe('example.com:8443');
    expect(await verifySignature(signed, '/object', 'baz=qux&foo=bar')).toBe(
      true
    );
  });

  it.each([
    { query: 'tag=b&tag=a', canonicalQuery: 'tag=a&tag=b' },
    {
      query: 'tag=b&tag=&tag=a%2Bb',
      canonicalQuery: 'tag=&tag=a%2Bb&tag=b',
    },
  ])(
    'signs every repeated query value in $query',
    async ({ query, canonicalQuery }) => {
      // Prepare
      const signer = new SigV4aSigner({ service: 's3', regionSet: ['*'] });
      const url = `https://example.com/object?${query}`;

      // Act
      const signed = await signer.sign(url);

      // Assess
      expect(signed.url).toBe(url);
      expect(await verifySignature(signed, '/object', canonicalQuery)).toBe(
        true
      );
    }
  );

  it('signs a Request input and preserves its returned body', async () => {
    // Prepare
    const signer = new SigV4aSigner({ service: 's3', regionSet: ['*'] });
    const request = new Request('https://example.com/object', {
      method: 'PUT',
      body: 'payload',
      headers: { 'x-custom-header': 'custom-value' },
    });

    // Act
    const signed = await signer.sign(request);

    // Assess
    expect(signed.method).toBe('PUT');
    expect(signed.headers.get('x-custom-header')).toBe('custom-value');
    expect(await verifySignature(signed, '/object')).toBe(true);
    expect(await signed.text()).toBe('payload');
  });

  it('signs binary request bodies', async () => {
    // Prepare
    const signer = new SigV4aSigner({ service: 's3', regionSet: ['*'] });
    const body = new Uint8Array([0, 1, 128, 255]);

    // Act
    const signed = await signer.sign('https://example.com/object', {
      method: 'PUT',
      body,
    });

    // Assess
    expect(await verifySignature(signed, '/object')).toBe(true);
    expect(new Uint8Array(await signed.arrayBuffer())).toEqual(body);
  });

  it('accepts static credentials in place of environment credentials', async () => {
    // Prepare
    vi.stubEnv('AWS_ACCESS_KEY_ID', undefined);
    vi.stubEnv('AWS_SECRET_ACCESS_KEY', undefined);
    const signer = new SigV4aSigner({
      service: 's3',
      regionSet: ['*'],
      credentials,
    });

    // Act
    const signed = await signer.sign('https://example.com/object');

    // Assess
    expect(await verifySignature(signed, '/object')).toBe(true);
  });

  it('resolves fresh credentials from a provider on each signing call', async () => {
    // Prepare
    const provider = vi
      .fn()
      .mockResolvedValueOnce({ ...credentials, sessionToken: 'first-token' })
      .mockResolvedValueOnce({ ...credentials, sessionToken: 'second-token' });
    const signer = new SigV4aSigner({
      service: 's3',
      regionSet: ['*'],
      credentials: provider,
    });

    // Act
    const first = await signer.sign('https://example.com/object');
    const second = await signer.sign('https://example.com/object');

    // Assess
    expect(provider).toHaveBeenCalledTimes(2);
    expect(first.headers.get('x-amz-security-token')).toBe('first-token');
    expect(second.headers.get('x-amz-security-token')).toBe('second-token');
    expect(await verifySignature(first, '/object')).toBe(true);
    expect(await verifySignature(second, '/object')).toBe(true);
  });

  it('includes the session token from the environment in the signature', async () => {
    // Prepare
    vi.stubEnv('AWS_SESSION_TOKEN', 'session-example');
    const signer = new SigV4aSigner({ service: 's3', regionSet: ['*'] });

    // Act
    const signed = await signer.sign('https://example.com/object');

    // Assess
    expect(signed.headers.get('x-amz-security-token')).toBe('session-example');
    expect(await verifySignature(signed, '/object')).toBe(true);
  });

  it.each(['AWS_ACCESS_KEY_ID', 'AWS_SECRET_ACCESS_KEY'])(
    'throws a configuration error when %s is missing',
    async (key) => {
      // Prepare
      vi.stubEnv(key, undefined);
      const signer = new SigV4aSigner({ service: 's3', regionSet: ['*'] });

      // Act & Assess
      await expect(signer.sign('https://example.com/object')).rejects.toThrow(
        SignerConfigError
      );
    }
  );

  it('preserves credential provider errors', async () => {
    // Prepare
    const error = new Error('credentials unavailable');
    const signer = new SigV4aSigner({
      service: 's3',
      regionSet: ['*'],
      credentials: async () => {
        throw error;
      },
    });

    // Act & Assess
    await expect(signer.sign('https://example.com/object')).rejects.toBe(error);
  });

  it('wraps signing failures and preserves their cause', async () => {
    // Prepare
    const signer = new SigV4aSigner({
      service: 's3',
      regionSet: ['*'],
      credentials: {
        // @ts-expect-error Force a Smithy credentials validation failure.
        accessKeyId: undefined,
        secretAccessKey: 'secret',
      },
    });

    // Act & Assess
    await expect(
      signer.sign('https://example.com/object')
    ).rejects.toMatchObject({
      name: 'RequestSigningError',
      cause: expect.any(Error),
    });
  });

  it('wraps request body read failures', async () => {
    // Prepare
    const error = new Error('stream cannot be read');
    vi.spyOn(Request.prototype, 'arrayBuffer').mockRejectedValue(error);
    const signer = new SigV4aSigner({ service: 's3', regionSet: ['*'] });

    // Act & Assess
    await expect(
      signer.sign('https://example.com/object', { method: 'PUT', body: 'data' })
    ).rejects.toThrow(RequestSigningError);
  });

  it('sends a SigV4a request with the signed fetcher', async () => {
    // Prepare
    const signer = new SigV4aSigner({ service: 's3', regionSet: ['*'] });
    const transport = vi
      .fn<typeof fetch>()
      .mockResolvedValue(new Response('ok'));
    const signedFetch = createSignedFetcher(signer, { fetch: transport });

    // Act
    const response = await signedFetch('https://example.com/object');

    // Assess
    expect(await response.text()).toBe('ok');
    expect(transport).toHaveBeenCalledWith(expect.any(Request));
    const [request] = transport.mock.calls[0];
    expect(request).toBeInstanceOf(Request);
    if (request instanceof Request) {
      expect(await verifySignature(request, '/object')).toBe(true);
    }
  });
});

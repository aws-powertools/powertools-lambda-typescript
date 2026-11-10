import { createHash, createHmac } from 'node:crypto';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { SigV4Signer } from '../../src/sigv4.js';

const credentials = {
  accessKeyId: 'AKIDEXAMPLE',
  secretAccessKey: 'wJalrXUtnFEMI/K7MDENG+bPxRfiCYEXAMPLEKEY',
};

/**
 * Computes a reference signature for the canonical path expected by S3.
 *
 * @param request - The signed request supplying the method, headers, and body.
 * @param canonicalPath - The expected S3 canonical URI.
 * @param service - The service used for the signing scope.
 */
const expectedAuthorization = async (
  request: Request,
  canonicalPath: string,
  service = 's3'
): Promise<string> => {
  const [, signedHeaders] =
    request.headers.get('authorization')?.match(/SignedHeaders=([^,]+)/) ?? [];
  if (!signedHeaders) throw new Error('Missing signed headers');
  const canonicalHeaders = signedHeaders
    .split(';')
    .map((header) => `${header}:${request.headers.get(header)}\n`)
    .join('');
  const bodyHash = createHash('sha256')
    .update(Buffer.from(await request.clone().arrayBuffer()))
    .digest('hex');
  const canonicalRequest = [
    request.method,
    canonicalPath,
    '',
    canonicalHeaders,
    signedHeaders,
    bodyHash,
  ].join('\n');
  const scope = `20260102/us-east-1/${service}/aws4_request`;
  const stringToSign = [
    'AWS4-HMAC-SHA256',
    '20260102T030405Z',
    scope,
    createHash('sha256').update(canonicalRequest).digest('hex'),
  ].join('\n');
  const dateKey = createHmac('sha256', `AWS4${credentials.secretAccessKey}`)
    .update('20260102')
    .digest();
  const regionKey = createHmac('sha256', dateKey).update('us-east-1').digest();
  const serviceKey = createHmac('sha256', regionKey).update(service).digest();
  const signingKey = createHmac('sha256', serviceKey)
    .update('aws4_request')
    .digest();
  const signature = createHmac('sha256', signingKey)
    .update(stringToSign)
    .digest('hex');
  return `AWS4-HMAC-SHA256 Credential=${credentials.accessKeyId}/${scope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;
};

describe('SigV4Signer S3 paths', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-02T03:04:05Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it.each([
    { path: '/a%20b', canonicalPath: '/a%20b' },
    { path: '/photo%20(1)!.jpg', canonicalPath: '/photo%20%281%29%21.jpg' },
    { path: '/a+b', canonicalPath: '/a%20b' },
    { path: '/a%2Bb', canonicalPath: '/a%2Bb' },
    { path: '/a%2fb%252Fc', canonicalPath: '/a/b%252Fc' },
    { path: '/folder//object/', canonicalPath: '/folder//object/' },
    { path: '/%E2%98%83', canonicalPath: '/%E2%98%83' },
    { path: '/~%7e%7E', canonicalPath: '/~~~' },
    { path: '/a%2f..%2fb', canonicalPath: '/a/../b' },
  ])(
    'signs the S3 canonical URI for $path',
    async ({ path, canonicalPath }) => {
      // Prepare
      const signer = new SigV4Signer({
        service: 's3',
        region: 'us-east-1',
        credentials,
      });
      const url = `https://example.s3.us-east-1.amazonaws.com${path}`;

      // Act
      const signed = await signer.sign(url);

      // Assess
      expect(signed.url).toBe(url);
      expect(signed.headers.get('authorization')).toBe(
        await expectedAuthorization(signed, canonicalPath)
      );
    }
  );

  it('keeps path escaping and normalization for other services', async () => {
    // Prepare
    const signer = new SigV4Signer({
      service: 'execute-api',
      region: 'us-east-1',
      credentials,
    });

    // Act
    const signed = await signer.sign('https://example.com/folder//a%20b');

    // Assess
    expect(signed.headers.get('authorization')).toBe(
      await expectedAuthorization(signed, '/folder/a%2520b', 'execute-api')
    );
  });

  it('preserves the request body and fetch settings for S3 requests', async () => {
    // Prepare
    const signer = new SigV4Signer({
      service: 's3',
      region: 'us-east-1',
      credentials,
    });
    const controller = new AbortController();
    const request = new Request(
      'https://example.s3.us-east-1.amazonaws.com/a%20b',
      {
        method: 'PUT',
        body: 'payload',
        signal: controller.signal,
        redirect: 'manual',
        cache: 'no-store',
      }
    );

    // Act
    const signed = await signer.sign(request);
    controller.abort();

    // Assess
    expect(await signed.text()).toBe('payload');
    expect(signed.redirect).toBe('manual');
    expect(signed.cache).toBe('no-store');
    expect(signed.signal.aborted).toBe(true);
  });
});

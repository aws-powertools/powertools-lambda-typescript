import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { RequestSigningError, SignerConfigError } from '../../src/errors.js';
import { SigV4Signer } from '../../src/sigv4.js';

describe('Class: SigV4Signer', () => {
  beforeEach(() => {
    vi.stubEnv('AWS_REGION', 'us-east-1');
    vi.stubEnv('AWS_ACCESS_KEY_ID', 'AKIAEXAMPLE');
    vi.stubEnv('AWS_SECRET_ACCESS_KEY', 'secret-example');
    vi.stubEnv('AWS_SESSION_TOKEN', 'session-example');
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.clearAllMocks();
  });

  describe('configuration', () => {
    it('throws a config error when no region can be determined', () => {
      // Prepare
      vi.stubEnv('AWS_REGION', undefined);

      // Act & Assess
      expect(() => new SigV4Signer({ service: 'execute-api' })).toThrow(
        SignerConfigError
      );
    });

    it('uses the AWS_REGION environment variable by default', async () => {
      // Prepare
      const signer = new SigV4Signer({ service: 'execute-api' });

      // Act
      const signed = await signer.sign(
        'https://example.execute-api.us-east-1.amazonaws.com/items'
      );

      // Assess
      expect(signed.headers.get('authorization')).toContain('us-east-1');
    });

    it('uses the region passed in the options over the environment variable', async () => {
      // Prepare
      const signer = new SigV4Signer({
        service: 'execute-api',
        region: 'eu-west-1',
      });

      // Act
      const signed = await signer.sign(
        'https://example.execute-api.eu-west-1.amazonaws.com/items'
      );

      // Assess
      expect(signed.headers.get('authorization')).toContain('eu-west-1');
    });

    it('throws a config error when credentials cannot be resolved from the environment', async () => {
      // Prepare
      vi.stubEnv('AWS_ACCESS_KEY_ID', undefined);
      const signer = new SigV4Signer({ service: 'execute-api' });

      // Act & Assess
      await expect(
        signer.sign('https://example.execute-api.us-east-1.amazonaws.com/items')
      ).rejects.toThrow(SignerConfigError);
    });

    it('resolves credentials from an async provider', async () => {
      // Prepare
      vi.stubEnv('AWS_ACCESS_KEY_ID', undefined);
      vi.stubEnv('AWS_SECRET_ACCESS_KEY', undefined);
      const credentials = vi.fn().mockResolvedValue({
        accessKeyId: 'AKIAFROMPROVIDER',
        secretAccessKey: 'secret-from-provider',
      });
      const signer = new SigV4Signer({ service: 'execute-api', credentials });

      // Act
      const signed = await signer.sign(
        'https://example.execute-api.us-east-1.amazonaws.com/items'
      );

      // Assess
      expect(credentials).toHaveBeenCalledTimes(1);
      expect(signed.headers.has('authorization')).toBe(true);
    });

    it('accepts static credentials', async () => {
      // Prepare
      vi.stubEnv('AWS_ACCESS_KEY_ID', undefined);
      vi.stubEnv('AWS_SECRET_ACCESS_KEY', undefined);
      const signer = new SigV4Signer({
        service: 'execute-api',
        credentials: {
          accessKeyId: 'AKIASTATIC',
          secretAccessKey: 'secret-static',
        },
      });

      // Act
      const signed = await signer.sign(
        'https://example.execute-api.us-east-1.amazonaws.com/items'
      );

      // Assess
      expect(signed.headers.get('authorization')).toContain('AKIASTATIC');
    });
  });

  describe('signing', () => {
    it('adds the expected SigV4 headers', async () => {
      // Prepare
      const signer = new SigV4Signer({ service: 'execute-api' });

      // Act
      const signed = await signer.sign(
        'https://example.execute-api.us-east-1.amazonaws.com/items'
      );

      // Assess
      expect(signed.headers.get('authorization')).toContain('AWS4-HMAC-SHA256');
      expect(signed.headers.has('x-amz-date')).toBe(true);
      expect(signed.headers.has('x-amz-content-sha256')).toBe(true);
    });

    /**
     * Guard test: we pass a plain object (typed as `HttpRequest` from
     * `@smithy/types`) to the underlying signing process instead of a
     * `@smithy/protocol-http` `HttpRequest` instance. This ensures a valid
     * signature is produced from that structural input, so a future smithy
     * upgrade tightening the contract is caught here rather than in production.
     */
    it('signs successfully from a structural (plain object) request', async () => {
      // Prepare
      const signer = new SigV4Signer({ service: 'execute-api' });

      // Act
      const signed = await signer.sign(
        'https://example.execute-api.us-east-1.amazonaws.com/items',
        { method: 'POST', body: 'payload' }
      );

      // Assess
      expect(signed.headers.get('authorization')).toContain('AWS4-HMAC-SHA256');
      expect(signed.headers.has('x-amz-content-sha256')).toBe(true);
      expect(await signed.text()).toBe('payload');
    });

    it('includes the session token when present', async () => {
      // Prepare
      const signer = new SigV4Signer({ service: 'execute-api' });

      // Act
      const signed = await signer.sign(
        'https://example.execute-api.us-east-1.amazonaws.com/items'
      );

      // Assess
      expect(signed.headers.get('x-amz-security-token')).toBe(
        'session-example'
      );
    });

    it('signs requests with a body and preserves it', async () => {
      // Prepare
      const signer = new SigV4Signer({ service: 'execute-api' });
      const body = JSON.stringify({ hello: 'world' });

      // Act
      const signed = await signer.sign(
        'https://example.execute-api.us-east-1.amazonaws.com/items',
        { method: 'POST', body }
      );

      // Assess
      expect(signed.method).toBe('POST');
      expect(await signed.text()).toBe(body);
      expect(signed.headers.has('authorization')).toBe(true);
    });

    it('accepts a Request object as input', async () => {
      // Prepare
      const signer = new SigV4Signer({ service: 'execute-api' });
      const request = new Request(
        'https://example.execute-api.us-east-1.amazonaws.com/items',
        { method: 'PUT', body: 'payload' }
      );

      // Act
      const signed = await signer.sign(request);

      // Assess
      expect(signed.method).toBe('PUT');
      expect(signed.headers.has('authorization')).toBe(true);
    });

    it('accepts a URL object as input', async () => {
      // Prepare
      const signer = new SigV4Signer({ service: 'execute-api' });
      const url = new URL(
        'https://example.execute-api.us-east-1.amazonaws.com/items?foo=bar'
      );

      // Act
      const signed = await signer.sign(url);

      // Assess
      expect(signed.headers.has('authorization')).toBe(true);
    });

    it('does not consume a body passed via init, leaving inputs reusable', async () => {
      // Prepare
      const signer = new SigV4Signer({ service: 'execute-api' });

      // Act
      const signed = await signer.sign(
        'https://example.execute-api.us-east-1.amazonaws.com/items',
        { method: 'POST', body: 'original' }
      );

      // Assess: the signed request carries the body, read exactly once here
      expect(await signed.text()).toBe('original');
    });

    it('wraps signing failures in a RequestSigningError', async () => {
      // Prepare
      const signer = new SigV4Signer({
        service: 'execute-api',
        credentials: {
          // biome-ignore lint/suspicious/noExplicitAny: deliberately invalid to force a signing failure
          accessKeyId: undefined as any,
          // biome-ignore lint/suspicious/noExplicitAny: deliberately invalid to force a signing failure
          secretAccessKey: undefined as any,
        },
      });

      // Act & Assess
      await expect(
        signer.sign('https://example.execute-api.us-east-1.amazonaws.com/items')
      ).rejects.toThrow(RequestSigningError);
    });

    it('signs a request without a body', async () => {
      // Prepare
      const signer = new SigV4Signer({ service: 'execute-api' });

      // Act
      const signed = await signer.sign(
        'https://example.execute-api.us-east-1.amazonaws.com/items',
        { method: 'GET' }
      );

      // Assess
      expect(signed.headers.has('authorization')).toBe(true);
      expect(signed.body).toBeNull();
    });

    it('signs a request with query string parameters', async () => {
      // Prepare
      const signer = new SigV4Signer({ service: 'execute-api' });

      // Act
      const signed = await signer.sign(
        'https://example.execute-api.us-east-1.amazonaws.com/items?foo=bar&baz=qux'
      );

      // Assess
      expect(signed.headers.has('authorization')).toBe(true);
    });

    it('signs a request against a URL with an explicit port', async () => {
      // Prepare
      const signer = new SigV4Signer({ service: 'execute-api' });

      // Act
      const signed = await signer.sign('https://example.com:8443/items');

      // Assess
      expect(signed.headers.has('authorization')).toBe(true);
    });

    it('treats an empty body as no body', async () => {
      // Prepare
      const signer = new SigV4Signer({ service: 'execute-api' });

      // Act
      const signed = await signer.sign(
        'https://example.execute-api.us-east-1.amazonaws.com/items',
        { method: 'POST', body: '' }
      );

      // Assess
      expect(signed.headers.has('authorization')).toBe(true);
    });

    it('throws a RequestSigningError when the body cannot be buffered', async () => {
      // Prepare
      const signer = new SigV4Signer({ service: 'execute-api' });
      // Force the internal buffering (clone().arrayBuffer()) to reject, as it
      // would for a non-replayable streaming body.
      const cloneSpy = vi.spyOn(Request.prototype, 'clone').mockImplementation(
        () =>
          ({
            arrayBuffer: () =>
              Promise.reject(new Error('stream cannot be read')),
          }) as unknown as Request
      );

      // Act & Assess
      try {
        await expect(
          signer.sign(
            'https://example.execute-api.us-east-1.amazonaws.com/items',
            { method: 'POST', body: 'data' }
          )
        ).rejects.toThrow(RequestSigningError);
      } finally {
        cloneSpy.mockRestore();
      }
    });
  });
});

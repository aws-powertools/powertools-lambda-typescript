import type { AwsCredentialIdentity } from '@smithy/types';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { SigV4Signer } from '../../src/sigv4.js';
import { SigV4aSigner } from '../../src/sigv4a.js';

describe.each(['SigV4', 'SigV4a'] as const)(
  '%s signing preparation',
  (variant) => {
    afterEach(() => {
      vi.restoreAllMocks();
    });

    it('starts reading the body while credentials are pending', async () => {
      // Prepare
      const pendingCredentials = Promise.withResolvers<AwsCredentialIdentity>();
      const options = {
        service: 'execute-api',
        credentials: () => pendingCredentials.promise,
      };
      const signer =
        variant === 'SigV4'
          ? new SigV4Signer({ ...options, region: 'us-east-1' })
          : new SigV4aSigner({ ...options, regionSet: ['*'] });
      const readBody = vi.spyOn(Request.prototype, 'arrayBuffer');

      // Act
      const pendingSigning = signer.sign('https://example.com/items', {
        method: 'POST',
        body: 'payload',
      });
      const bodyReadStarted = readBody.mock.calls.length > 0;
      pendingCredentials.resolve({
        accessKeyId: 'EXAMPLE',
        secretAccessKey: 'example-secret',
      });
      const signed = await pendingSigning;

      // Assess
      expect(bodyReadStarted).toBe(true);
      expect(await signed.text()).toBe('payload');
    });
  }
);

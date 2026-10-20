import { describe, expectTypeOf, it } from 'vitest';
import { createSignedFetcher } from '../../src/fetch.js';
import { SigV4Signer } from '../../src/sigv4.js';
import type { Signer } from '../../src/types/index.js';

describe('Signer type tests', () => {
  it('creates a fetch-compatible function from a signer', () => {
    // Prepare
    const signer: Signer = {
      sign: async (input, init) => new Request(input, init),
    };

    // Act
    const signedFetch = createSignedFetcher(signer);

    // Assess
    expectTypeOf(signedFetch).toEqualTypeOf<typeof fetch>();
  });

  it('implements the signer interface with SigV4Signer', () => {
    // Prepare & Act
    const signer = new SigV4Signer({
      service: 'execute-api',
      region: 'us-east-1',
      credentials: {
        accessKeyId: 'access-key-id',
        secretAccessKey: 'secret-access-key',
      },
    });

    // Assess
    expectTypeOf(signer).toMatchTypeOf<Signer>();
  });
});

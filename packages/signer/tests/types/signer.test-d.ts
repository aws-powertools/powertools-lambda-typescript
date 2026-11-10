import { describe, expectTypeOf, it } from 'vitest';
import { createSignedFetcher } from '../../src/fetch.js';
import { SigV4Signer } from '../../src/sigv4.js';
import type { SigV4aSignerOptions } from '../../src/sigv4a.js';
import { SigV4aSigner } from '../../src/sigv4a.js';
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

  it('implements the signer interface with SigV4aSigner', () => {
    // Prepare & Act
    const signer = new SigV4aSigner({
      service: 's3',
      regionSet: ['us-east-1', 'us-west-2'] as const,
      credentials: async () => ({
        accessKeyId: 'access-key-id',
        secretAccessKey: 'secret-access-key',
      }),
    });

    // Assess
    expectTypeOf(signer).toMatchTypeOf<Signer>();
    expectTypeOf(createSignedFetcher(signer)).toEqualTypeOf<typeof fetch>();
  });

  it('requires an explicit region set for SigV4a', () => {
    // Prepare & Act & Assess
    expectTypeOf<SigV4aSignerOptions>().toHaveProperty('regionSet');
    expectTypeOf<{ service: string }>().not.toExtend<SigV4aSignerOptions>();
    expectTypeOf<SigV4aSignerOptions>().not.toHaveProperty('region');
  });
});

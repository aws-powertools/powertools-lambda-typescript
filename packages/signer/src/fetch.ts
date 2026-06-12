import type { SignedFetcherOptions, Signer } from './types/index.js';

/**
 * Create a drop-in `fetch` function that signs every request with the given
 * {@link Signer | `Signer`} before sending it.
 *
 * The returned function has the same signature as the global `fetch`, so it can
 * be passed to libraries that accept a custom `fetch` implementation, or used
 * directly.
 *
 * @example
 * ```ts
 * import { SigV4Signer } from '@aws-lambda-powertools/signer/sigv4';
 * import { createSignedFetcher } from '@aws-lambda-powertools/signer/fetch';
 *
 * const signer = new SigV4Signer({ service: 'execute-api' });
 * const signedFetch = createSignedFetcher(signer);
 *
 * const response = await signedFetch('https://example.execute-api.us-east-1.amazonaws.com/items');
 * ```
 *
 * @param signer - The signer used to sign each request before it is sent.
 * @param options - Optional configuration, e.g. a custom `fetch` implementation.
 */
const createSignedFetcher = (
  signer: Signer,
  options: SignedFetcherOptions = {}
): typeof fetch => {
  const fetchImpl = options.fetch ?? fetch;

  return async (input, init) => {
    const signed = await signer.sign(input as string | URL | Request, init);
    return fetchImpl(signed);
  };
};

export type { SignedFetcherOptions, Signer } from './types/index.js';
export { createSignedFetcher };

import type {
  AwsCredentialIdentity,
  AwsCredentialIdentityProvider,
} from '@smithy/types';

/**
 * A request signer.
 *
 * This is the structural contract that every signing variant (e.g. SigV4, and
 * future variants such as SigV4a) implements, and the contract that the
 * `createSignedFetcher` factory depends on.
 *
 * Implementations take a web-standard request and return a signed
 * web-standard {@link Request | `Request`}, performing no network I/O.
 */
interface Signer {
  /**
   * Sign a request and return a new, signed {@link Request | `Request`}.
   *
   * @param input - The resource to sign, as a URL string, {@link URL | `URL`}, or {@link Request | `Request`}.
   * @param init - Optional request options, matching the `fetch` `init` argument.
   */
  sign(input: string | URL | Request, init?: RequestInit): Promise<Request>;
}

/**
 * Options for constructing a {@link Signer | `Signer`} that uses the AWS
 * Signature Version 4 signing process.
 */
interface SigV4SignerOptions {
  /**
   * The service name to use when signing the request, e.g. `execute-api`,
   * `lambda`, or `appsync`.
   *
   * This value cannot be reliably derived at runtime (custom domains and
   * CloudFront hide the underlying service), so it is required.
   */
  service: string;
  /**
   * The AWS region to use when signing the request.
   *
   * @default process.env.AWS_REGION
   */
  region?: string;
  /**
   * The credentials to use when signing the request, either as a static
   * value or as a provider that resolves them.
   *
   * @default credentials read from the standard Lambda environment variables
   */
  credentials?: AwsCredentialIdentity | AwsCredentialIdentityProvider;
}

/**
 * Options for the `createSignedFetcher` factory.
 */
interface SignedFetcherOptions {
  /**
   * The `fetch` implementation to use when sending the signed request.
   *
   * @default the global `fetch`
   */
  fetch?: typeof fetch;
}

export type { SignedFetcherOptions, Signer, SigV4SignerOptions };

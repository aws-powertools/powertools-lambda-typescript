import type {
  AwsCredentialIdentity,
  AwsCredentialIdentityProvider,
} from '@smithy/types';

/**
 * A request signer.
 *
 * This is the structural contract that every signing variant (SigV4 and
 * SigV4a) implements, and the contract that the `createSignedFetcher` factory
 * depends on.
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
 * Configures the service and credentials shared by AWS request signers.
 */
interface AwsSignerOptions {
  /**
   * The service name to use when signing the request, e.g. `execute-api`,
   * `lambda`, or `appsync`.
   *
   * This value cannot be reliably derived at runtime (custom domains and
   * CloudFront hide the underlying service), so it is required.
   */
  service: string;
  /**
   * The credentials to use when signing the request, either as a static
   * value or as a provider that resolves them.
   *
   * @default credentials read from the standard Lambda environment variables
   */
  credentials?: AwsCredentialIdentity | AwsCredentialIdentityProvider;
}

/**
 * Configures a signer that uses AWS Signature Version 4.
 */
interface SigV4SignerOptions extends AwsSignerOptions {
  /**
   * The AWS region to use when signing the request.
   *
   * @default process.env.AWS_REGION
   */
  region?: string;
}

/**
 * Configures a signer that uses AWS Signature Version 4A.
 */
interface SigV4aSignerOptions extends AwsSignerOptions {
  /**
   * The AWS regions in which the signature is valid.
   *
   * Provide at least one region or wildcard pattern, such as
   * `['us-east-1', 'us-west-2']`, `['us-west-*']`, or `['*']` for all regions.
   * This option is required and does not default to `AWS_REGION`.
   */
  regionSet: readonly string[];
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

export type {
  AwsSignerOptions,
  SignedFetcherOptions,
  Signer,
  SigV4aSignerOptions,
  SigV4SignerOptions,
};

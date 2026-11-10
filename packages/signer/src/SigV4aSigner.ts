import { SignatureV4a } from '@smithy/signature-v4a';
import type {
  AwsCredentialIdentity,
  AwsCredentialIdentityProvider,
  HttpRequest,
} from '@smithy/types';
import { SERVICE_S3 } from './constants.js';
import { RequestSigningError, SignerConfigError } from './errors.js';
import {
  credentialsFromEnv,
  resolveCredentials,
  toHttpRequest,
  toRequest,
  toSigningRequest,
} from './helpers.js';
import { Sha256 } from './Sha256.js';
import type { Signer, SigV4aSignerOptions } from './types/index.js';

/**
 * Signs web-standard requests using AWS Signature Version 4A (SigV4a).
 *
 * SigV4a uses ECDSA signatures valid in a set of AWS regions, for services
 * such as Amazon S3 Multi-Region Access Points. The signer performs no network
 * I/O and works with `createSignedFetcher` from the `/fetch` entry point.
 *
 * @example
 * ```ts
 * import { SigV4aSigner } from '@aws-lambda-powertools/signer/sigv4a';
 *
 * const signer = new SigV4aSigner({ service: 's3', regionSet: ['*'] });
 * const signed = await signer.sign('https://example.accesspoint.s3-global.amazonaws.com/object');
 * ```
 */
class SigV4aSigner implements Signer {
  readonly #service: string;
  readonly #regionSet: string;
  readonly #credentials: AwsCredentialIdentity | AwsCredentialIdentityProvider;

  /**
   * Creates a signer for the specified service and region set.
   *
   * @param options - The service, region set, and optional credentials.
   */
  public constructor(options: SigV4aSignerOptions) {
    if (
      options.regionSet.length === 0 ||
      options.regionSet.some(
        (region) => !/^[a-z0-9*]+(-[a-z0-9*]+)*$/.test(region)
      )
    ) {
      throw new SignerConfigError(
        'Set `regionSet` to a non-empty array of AWS regions or wildcard patterns, for example ["us-east-1", "us-west-2"] or ["*"].'
      );
    }

    this.#service = options.service;
    this.#regionSet = options.regionSet.join(',');
    this.#credentials = options.credentials ?? credentialsFromEnv;
  }

  /**
   * Signs a request and returns a new request with the SigV4a headers.
   *
   * @param input - The URL string, URL, or request to sign.
   * @param init - Optional request options matching the `fetch` init argument.
   */
  public async sign(
    input: string | URL | Request,
    init?: RequestInit
  ): Promise<Request> {
    const request = toSigningRequest(input, init);
    const [credentials, httpRequest] = await Promise.all([
      resolveCredentials(this.#credentials),
      toHttpRequest(request, this.#service),
    ]);
    const signer = new SignatureV4a({
      service: this.#service,
      region: this.#regionSet,
      credentials,
      sha256: Sha256,
      uriEscapePath: this.#service !== SERVICE_S3,
    });

    let signed: HttpRequest;
    try {
      signed = await signer.sign(httpRequest, {});
    } catch (error) {
      throw new RequestSigningError('Failed to sign the request', {
        cause: error,
      });
    }

    return toRequest(signed, request);
  }
}

export { SigV4aSigner };

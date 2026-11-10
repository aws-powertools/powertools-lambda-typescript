import { getStringFromEnv } from '@aws-lambda-powertools/commons/utils/env';
import { SignatureV4 } from '@smithy/signature-v4';
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
import type { Signer, SigV4SignerOptions } from './types/index.js';

/**
 * A {@link Signer | `Signer`} that signs requests using the AWS Signature
 * Version 4 (SigV4) signing process.
 *
 * The signer takes and returns web-standard {@link Request | `Request`}
 * objects and performs no network I/O. To send signed requests, pass an
 * instance to `createSignedFetcher` from `@aws-lambda-powertools/signer/fetch`.
 *
 * @example
 * ```ts
 * import { SigV4Signer } from '@aws-lambda-powertools/signer/sigv4';
 *
 * const signer = new SigV4Signer({ service: 'execute-api' });
 * const signed = await signer.sign('https://example.execute-api.us-east-1.amazonaws.com/items');
 * ```
 */
class SigV4Signer implements Signer {
  readonly #service: string;
  readonly #region: string;
  readonly #credentials: AwsCredentialIdentity | AwsCredentialIdentityProvider;

  /**
   * Creates a signer for the specified service and AWS region.
   *
   * @param options - The service and optional region and credentials.
   */
  public constructor(options: SigV4SignerOptions) {
    this.#service = options.service;

    const region =
      options.region ??
      getStringFromEnv({ key: 'AWS_REGION', defaultValue: '' });
    if (region === '') {
      throw new SignerConfigError(
        'Unable to determine the AWS region to sign the request with. Set the `region` option or the `AWS_REGION` environment variable.'
      );
    }
    this.#region = region;

    this.#credentials = options.credentials ?? credentialsFromEnv;
  }

  /**
   * Signs a request and preserves its fetch options in the returned request.
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

    const signer = new SignatureV4({
      service: this.#service,
      region: this.#region,
      credentials,
      sha256: Sha256,
      uriEscapePath: this.#service !== SERVICE_S3,
    });

    let signed: HttpRequest;
    try {
      signed = await signer.sign(httpRequest);
    } catch (error) {
      throw new RequestSigningError('Failed to sign the request', {
        cause: error,
      });
    }

    return toRequest(signed, request);
  }
}

export { SigV4Signer };

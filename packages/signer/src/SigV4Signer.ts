import { SignatureV4 } from '@smithy/signature-v4';
import type {
  AwsCredentialIdentity,
  AwsCredentialIdentityProvider,
  HttpRequest,
} from '@smithy/types';
import { RequestSigningError, SignerConfigError } from './errors.js';
import { Sha256 } from './Sha256.js';
import type { Signer, SigV4SignerOptions } from './types/index.js';

/**
 * Credential provider that reads AWS credentials from the standard environment
 * variables that the AWS Lambda runtime always injects.
 *
 * Throws a {@link SignerConfigError | `SignerConfigError`} when the required
 * variables are not present, e.g. when running outside of Lambda.
 */
const credentialsFromEnv: AwsCredentialIdentityProvider = async () => {
  const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
  const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
  if (accessKeyId === undefined || secretAccessKey === undefined) {
    throw new SignerConfigError(
      'Unable to resolve AWS credentials to sign the request with. Ensure the standard AWS credentials environment variables are set, or pass the `credentials` option.'
    );
  }

  return {
    accessKeyId,
    secretAccessKey,
    sessionToken: process.env.AWS_SESSION_TOKEN,
  };
};

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

  public constructor(options: SigV4SignerOptions) {
    this.#service = options.service;

    const region = options.region ?? process.env.AWS_REGION;
    if (region === undefined || region === '') {
      throw new SignerConfigError(
        'Unable to determine the AWS region to sign the request with. Set the `region` option or the `AWS_REGION` environment variable.'
      );
    }
    this.#region = region;

    this.#credentials = options.credentials ?? credentialsFromEnv;
  }

  public async sign(
    input: string | URL | Request,
    init?: RequestInit
  ): Promise<Request> {
    const request = new Request(input, init);
    const credentials = await this.#resolveCredentials();
    const httpRequest = await this.#toHttpRequest(request);

    const signer = new SignatureV4({
      service: this.#service,
      region: this.#region,
      credentials,
      sha256: Sha256,
    });

    let signed: HttpRequest;
    try {
      signed = (await signer.sign(httpRequest)) as HttpRequest;
    } catch (error) {
      throw new RequestSigningError('Failed to sign the request', {
        cause: error,
      });
    }

    return this.#toRequest(signed, request);
  }

  /**
   * Resolve the configured credentials, supporting both static values and
   * async providers. The default env-var provider throws a configuration error
   * when no credentials are available.
   */
  async #resolveCredentials(): Promise<AwsCredentialIdentity> {
    return typeof this.#credentials === 'function'
      ? await this.#credentials()
      : this.#credentials;
  }

  /**
   * Adapt a web-standard `Request` into the `HttpRequest` shape expected by the
   * underlying signing process, buffering the body so it can be hashed.
   *
   * The signing process accepts a plain object matching the `HttpRequest`
   * interface, so we avoid depending on `@smithy/protocol-http` just to
   * construct one.
   */
  async #toHttpRequest(request: Request): Promise<HttpRequest> {
    const url = new URL(request.url);

    const headers: Record<string, string> = {};
    for (const [key, value] of request.headers) {
      headers[key] = value;
    }
    headers.host = url.host;

    const query: Record<string, string> = {};
    for (const [key, value] of url.searchParams) {
      query[key] = value;
    }

    const body = await this.#readBody(request);

    return {
      method: request.method,
      protocol: url.protocol,
      hostname: url.hostname,
      port: url.port ? Number(url.port) : undefined,
      path: url.pathname,
      query,
      headers,
      body,
    };
  }

  /**
   * Buffer the request body so it can be both hashed for signing and replayed
   * when the signed request is sent.
   *
   * Most bodies (strings, buffers, and finite streams) are buffered
   * transparently. A body that cannot be read or replayed — for example a
   * stream that errors mid-read — cannot be signed and results in a
   * {@link RequestSigningError | `RequestSigningError`}.
   */
  async #readBody(request: Request): Promise<Uint8Array | undefined> {
    if (request.body === null || request.body === undefined) {
      return undefined;
    }

    try {
      const buffer = await request.clone().arrayBuffer();
      return buffer.byteLength === 0 ? undefined : new Uint8Array(buffer);
    } catch (error) {
      throw new RequestSigningError(
        'Unable to read the request body to sign it. The body could not be buffered, for example because it is a stream that cannot be replayed.',
        { cause: error }
      );
    }
  }

  /**
   * Adapt a signed `HttpRequest` back into a web-standard `Request`, carrying
   * over the signed headers and the original (buffered) body.
   */
  #toRequest(signed: HttpRequest, original: Request): Request {
    const headers = new Headers();
    for (const [key, value] of Object.entries(signed.headers)) {
      headers.set(key, value);
    }

    return new Request(original.url, {
      method: signed.method,
      headers,
      body: signed.body as BodyInit | null | undefined,
    });
  }
}

export { SigV4Signer };

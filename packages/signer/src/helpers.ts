import { getStringFromEnv } from '@aws-lambda-powertools/commons/utils/env';
import type {
  AwsCredentialIdentity,
  AwsCredentialIdentityProvider,
  HttpRequest,
} from '@smithy/types';
import type { BodyInit } from 'undici-types';
import { SERVICE_S3 } from './constants.js';
import { RequestSigningError, SignerConfigError } from './errors.js';

/**
 * Builds the canonical S3 URI for an already parsed request URL.
 *
 * S3 treats raw plus signs as spaces and decodes escaped slashes in object
 * keys. Preserve other escapes without double-encoding their percent signs.
 *
 * @param path - The URL pathname as it will be sent to S3.
 * @internal
 */
const canonicalS3Path = (path: string): string =>
  encodeURIComponent(path.replace(/\+/g, ' '))
    .replace(
      /[!'()*]/g,
      (character) => `%${character.charCodeAt(0).toString(16).toUpperCase()}`
    )
    .replace(/%2F/g, '/')
    .replace(/%25([a-f0-9]{2})/gi, (_match, byte: string) => {
      const character = String.fromCharCode(Number.parseInt(byte, 16));
      return /^[a-z0-9._~/-]$/i.test(character)
        ? character
        : `%${byte.toUpperCase()}`;
    });

/**
 * Reads credentials from the standard AWS Lambda environment variables.
 *
 * @internal
 */
const credentialsFromEnv: AwsCredentialIdentityProvider = async () => {
  const accessKeyId = getStringFromEnv({
    key: 'AWS_ACCESS_KEY_ID',
    defaultValue: '',
  });
  const secretAccessKey = getStringFromEnv({
    key: 'AWS_SECRET_ACCESS_KEY',
    defaultValue: '',
  });
  if (accessKeyId === '' || secretAccessKey === '') {
    throw new SignerConfigError(
      'Unable to resolve AWS credentials to sign the request with. Ensure the standard AWS credentials environment variables are set, or pass the `credentials` option.'
    );
  }

  return {
    accessKeyId,
    secretAccessKey,
    sessionToken:
      getStringFromEnv({ key: 'AWS_SESSION_TOKEN', defaultValue: '' }) ||
      undefined,
  };
};

/**
 * Resolves static credentials or invokes the configured credential provider.
 *
 * @param credentials - The configured credentials or provider.
 * @internal
 */
const resolveCredentials = async (
  credentials: AwsCredentialIdentity | AwsCredentialIdentityProvider
): Promise<AwsCredentialIdentity> =>
  typeof credentials === 'function' ? await credentials() : credentials;

/**
 * Creates a request and preserves its referrer settings across init overrides.
 *
 * @param input - The URL or request to sign.
 * @param init - The request options to apply.
 * @internal
 */
const toSigningRequest = (
  input: string | URL | Request,
  init?: RequestInit
): Request =>
  new Request(
    input,
    input instanceof Request
      ? {
          ...init,
          referrer: init?.referrer ?? input.referrer,
          referrerPolicy: init?.referrerPolicy ?? input.referrerPolicy,
        }
      : init
  );

/**
 * Buffers the request body so it can be hashed and replayed after signing.
 *
 * @param request - The request whose body to read.
 * @internal
 */
const readBody = async (request: Request): Promise<Uint8Array | undefined> => {
  if (request.body === null) {
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
};

/**
 * Adapts a web-standard request into the structural Smithy HTTP request shape.
 *
 * @param request - The request to adapt, buffering its body for signing.
 * @param service - The signing service that determines canonical-path rules.
 * @internal
 */
const toHttpRequest = async (
  request: Request,
  service: string
): Promise<HttpRequest> => {
  const url = new URL(request.url);
  const headers: Record<string, string> = {};
  for (const [key, value] of request.headers) {
    headers[key] = value;
  }
  headers.host = url.host;

  // A repeated query parameter keeps all its values, as SigV4 signs each one.
  const query: Record<string, string[]> = {};
  for (const [key, value] of url.searchParams) {
    query[key] ??= [];
    query[key].push(value);
  }

  return {
    method: request.method,
    protocol: url.protocol,
    hostname: url.hostname,
    port: url.port ? Number(url.port) : undefined,
    path: service === SERVICE_S3 ? canonicalS3Path(url.pathname) : url.pathname,
    query,
    headers,
    body: await readBody(request),
  };
};

/**
 * Creates a web-standard request with the signed headers and buffered body.
 *
 * @param signed - The signed Smithy HTTP request.
 * @param original - The original request supplying the URL.
 * @internal
 */
const toRequest = (signed: HttpRequest, original: Request): Request => {
  const headers = new Headers();
  for (const [key, value] of Object.entries(signed.headers)) {
    headers.set(key, value);
  }

  return new Request(original, {
    method: signed.method,
    headers,
    // Request resets referrer settings when init contains overrides.
    referrer: original.referrer,
    referrerPolicy: original.referrerPolicy,
    // Smithy's body type is broader than fetch's; our adapter supplies only bytes.
    body: signed.body as BodyInit | undefined,
  });
};

export {
  credentialsFromEnv,
  resolveCredentials,
  toHttpRequest,
  toRequest,
  toSigningRequest,
};

import { createHash, createHmac, type Hash, type Hmac } from 'node:crypto';
import type { Checksum, SourceData } from '@smithy/types';

/**
 * A {@link Checksum | `Checksum`} implementation backed by `node:crypto`.
 *
 * The underlying signing process expects a hash constructor that supports both
 * plain SHA-256 (for hashing payloads) and HMAC-SHA256 with a secret (for
 * deriving the signing key). Using `node:crypto` avoids pulling in a
 * third-party crypto dependency, relying instead on the Node.js runtime that
 * AWS Lambda provides.
 *
 * @internal
 */
class Sha256 implements Checksum {
  readonly #hash: Hash | Hmac;

  public constructor(secret?: SourceData) {
    this.#hash =
      secret === undefined
        ? createHash('sha256')
        : createHmac('sha256', secret as Uint8Array | string);
  }

  public update(data: SourceData): void {
    this.#hash.update(data as Uint8Array | string);
  }

  public async digest(): Promise<Uint8Array> {
    return new Uint8Array(this.#hash.digest());
  }

  public reset(): void {
    // `node:crypto` hashes are single-use; reset is a no-op because a new
    // instance is created per hashing operation by the signing process.
  }
}

export { Sha256 };

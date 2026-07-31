import { createHash, createHmac, type Hash, type Hmac } from 'node:crypto';
import type { Checksum, SourceData } from '@smithy/types';

/**
 * Convert smithy's {@link SourceData | `SourceData`} into a value accepted by
 * `node:crypto`.
 *
 * `SourceData` is `string | ArrayBuffer | ArrayBufferView`, while `node:crypto`
 * accepts `string | NodeJS.ArrayBufferView` - it rejects a bare `ArrayBuffer`
 * at runtime, and TypeScript's structural `ArrayBufferView` is not assignable
 * to Node's concrete union of typed arrays. Wrapping non-string inputs in a
 * `Uint8Array` bridges both gaps without copying the underlying bytes.
 */
const toBinary = (data: SourceData): string | Uint8Array => {
  if (typeof data === 'string') {
    return data;
  }
  if (ArrayBuffer.isView(data)) {
    return new Uint8Array(data.buffer, data.byteOffset, data.byteLength);
  }
  return new Uint8Array(data);
};

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
        : createHmac('sha256', toBinary(secret));
  }

  public update(data: SourceData): void {
    this.#hash.update(toBinary(data));
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

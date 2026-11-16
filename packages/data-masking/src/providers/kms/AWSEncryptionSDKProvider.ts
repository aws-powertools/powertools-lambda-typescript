import {
  buildDecrypt,
  buildEncrypt,
  getLocalCryptographicMaterialsCache,
  KmsKeyringNode,
  NodeCachingMaterialsManager,
} from '@aws-crypto/client-node';
import { RESERVED_ENCRYPTION_CONTEXT_PREFIX } from '../../constants.js';
import { DataMaskingEncryptionError } from '../../errors.js';
import type { EncryptionProvider } from '../../types.js';
import type { AWSEncryptionSDKProviderOptions, SDKClient } from './types.js';

const isReservedContextKey = (key: string): boolean =>
  key.startsWith(RESERVED_ENCRYPTION_CONTEXT_PREFIX);

const formatContextKeys = (keys: string[]): string =>
  keys
    .toSorted()
    .map((key) => `'${key}'`)
    .join(', ');

/**
 * Encryption provider backed by the AWS Encryption SDK and KMS keys.
 *
 * This provider lives in its own sub-path export so that the optional
 * `@aws-crypto/client-node` peer dependency is only required when the
 * provider is actually imported.
 *
 * @example
 * ```typescript
 * import { DataMasking } from '@aws-lambda-powertools/data-masking';
 * import { AWSEncryptionSDKProvider } from '@aws-lambda-powertools/data-masking/providers/kms';
 *
 * const masker = new DataMasking({
 *   provider: new AWSEncryptionSDKProvider({
 *     keys: ['arn:aws:kms:us-east-1:123456789012:key/my-key'],
 *   }),
 * });
 * ```
 */
export class AWSEncryptionSDKProvider implements EncryptionProvider {
  readonly #client: SDKClient;

  public constructor(options: AWSEncryptionSDKProviderOptions) {
    const { encrypt } = buildEncrypt();
    const { decrypt } = buildDecrypt();

    const keyring = new KmsKeyringNode({
      generatorKeyId: options.keys[0],
      keyIds: options.keys.slice(1),
    });

    const cache = getLocalCryptographicMaterialsCache(
      options.localCacheCapacity ?? 100
    );

    this.#client = {
      encryptFn: encrypt,
      decryptFn: decrypt,
      cacheManager: new NodeCachingMaterialsManager({
        backingMaterials: keyring,
        cache,
        maxAge: (options.maxCacheAgeSeconds ?? 300) * 1000,
        maxMessagesEncrypted: options.maxMessagesEncrypted ?? 4294967296,
        maxBytesEncrypted: options.maxBytesEncrypted ?? Number.MAX_SAFE_INTEGER,
      }),
    };
  }

  /**
   * Encrypts data with the configured KMS keys.
   *
   * @param data - the data to encrypt
   * @param context - the encryption context (additional authenticated data) to bind to the ciphertext
   */
  async encrypt(
    data: string,
    context?: Record<string, string>
  ): Promise<string> {
    const { encryptFn, cacheManager } = this.#client;

    if (context) {
      const reservedKeys = Object.keys(context).filter(isReservedContextKey);
      if (reservedKeys.length > 0) {
        throw new DataMaskingEncryptionError(
          `Encryption context keys starting with '${RESERVED_ENCRYPTION_CONTEXT_PREFIX}' are reserved by the AWS Encryption SDK: ${formatContextKeys(reservedKeys)}`
        );
      }
    }

    const plaintext = new TextEncoder().encode(data);
    const { result } = await encryptFn(cacheManager, plaintext, {
      encryptionContext: context,
    });

    return Buffer.from(result).toString('base64');
  }

  /**
   * Decrypts data previously encrypted by this provider.
   *
   * The encryption context stored with the ciphertext must match `context` exactly, so you
   * have to provide the same context used to encrypt the data.
   *
   * @param data - the base64-encoded ciphertext to decrypt
   * @param context - the encryption context (additional authenticated data) used to encrypt the data
   */
  async decrypt(
    data: string,
    context?: Record<string, string>
  ): Promise<string> {
    const { decryptFn, cacheManager } = this.#client;
    const ciphertext = Buffer.from(data, 'base64');
    const { plaintext, messageHeader } = await decryptFn(
      cacheManager,
      new Uint8Array(ciphertext)
    );

    this.#verifyEncryptionContext(messageHeader.encryptionContext, context);

    return new TextDecoder().decode(plaintext);
  }

  /**
   * Compares the encryption context stored with the ciphertext to the one provided on decrypt.
   *
   * Every stored key must be provided with the same value, and no extra key may be provided.
   * Keys reserved by the AWS Encryption SDK are ignored on both sides, since the SDK adds and
   * verifies them itself.
   *
   * @param storedContext - the encryption context found in the message header
   * @param providedContext - the encryption context provided by the caller
   */
  #verifyEncryptionContext(
    storedContext: Record<string, string>,
    providedContext: Record<string, string> = {}
  ): void {
    const missingKeys: string[] = [];
    const mismatchedKeys: string[] = [];

    for (const [key, value] of Object.entries(storedContext)) {
      if (isReservedContextKey(key)) continue;

      if (!Object.hasOwn(providedContext, key)) {
        missingKeys.push(key);
      } else if (providedContext[key] !== value) {
        mismatchedKeys.push(key);
      }
    }

    const unknownKeys = Object.keys(providedContext).filter(
      (key) => !isReservedContextKey(key) && !Object.hasOwn(storedContext, key)
    );

    const details: string[] = [];
    if (missingKeys.length > 0) {
      details.push(`missing keys ${formatContextKeys(missingKeys)}`);
    }
    if (mismatchedKeys.length > 0) {
      details.push(
        `different values for keys ${formatContextKeys(mismatchedKeys)}`
      );
    }
    if (unknownKeys.length > 0) {
      details.push(`unknown keys ${formatContextKeys(unknownKeys)}`);
    }
    if (details.length === 0) return;

    throw new DataMaskingEncryptionError(
      `Encryption context mismatch (${details.join('; ')}). You must provide the same encryption context used to encrypt the data.`
    );
  }
}

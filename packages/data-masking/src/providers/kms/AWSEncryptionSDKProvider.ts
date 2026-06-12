import {
  buildDecrypt,
  buildEncrypt,
  getLocalCryptographicMaterialsCache,
  KmsKeyringNode,
  NodeCachingMaterialsManager,
} from '@aws-crypto/client-node';
import { DataMaskingEncryptionError } from '../../errors.js';
import type { EncryptionProvider } from '../../types.js';
import type { AWSEncryptionSDKProviderOptions, SDKClient } from './types.js';

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

  async encrypt(
    data: string,
    context?: Record<string, string>
  ): Promise<string> {
    const { encryptFn, cacheManager } = this.#client;
    const plaintext = new TextEncoder().encode(data);
    const { result } = await encryptFn(cacheManager, plaintext, {
      encryptionContext: context,
    });

    return Buffer.from(result).toString('base64');
  }

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

    if (context) {
      for (const [key, value] of Object.entries(context)) {
        if (messageHeader.encryptionContext[key] !== value) {
          throw new DataMaskingEncryptionError(
            `Encryption context mismatch for key '${key}'`
          );
        }
      }
    }

    return new TextDecoder().decode(plaintext);
  }
}

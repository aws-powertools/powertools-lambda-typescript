import type { buildDecrypt, buildEncrypt } from '@aws-crypto/client-node';
import { DataMaskingEncryptionError } from '../errors.js';
import type { EncryptionProvider } from '../types.js';

/** Options for the {@link AWSEncryptionSDKProvider} constructor. */
export interface AWSEncryptionSDKProviderOptions {
  /** KMS key ARNs; the first is the generator key, the rest are additional keys. */
  keys: string[];
  /** The maximum number of entries that can be retained in the local cryptographic materials cache. Default: `100`. */
  localCacheCapacity?: number;
  /** The maximum time (in seconds) that a cache entry may be kept in the cache. Default: `300`. */
  maxCacheAgeSeconds?: number;
  /** The maximum number of messages that may be encrypted under a cache entry. Default: `4294967296` (2^32). */
  maxMessagesEncrypted?: number;
  /** The maximum number of bytes that may be encrypted under a cache entry. Default: `Number.MAX_SAFE_INTEGER`. */
  maxBytesEncrypted?: number;
}

type EncryptFn = ReturnType<typeof buildEncrypt>['encrypt'];
type DecryptFn = ReturnType<typeof buildDecrypt>['decrypt'];
type CacheManager = Parameters<EncryptFn>[0];

interface SDKClient {
  encryptFn: EncryptFn;
  decryptFn: DecryptFn;
  cacheManager: CacheManager;
}

export class AWSEncryptionSDKProvider implements EncryptionProvider {
  readonly #options: AWSEncryptionSDKProviderOptions;
  #client?: SDKClient;

  public constructor(options: AWSEncryptionSDKProviderOptions) {
    this.#options = options;
  }

  async #init(): Promise<SDKClient> {
    if (this.#client) return this.#client;

    // Dynamic import — @aws-crypto/client-node is an optional peer dep,
    // so we only load it when encryption is actually used.
    const {
      buildEncrypt,
      buildDecrypt,
      KmsKeyringNode,
      getLocalCryptographicMaterialsCache,
      NodeCachingMaterialsManager,
    } = await import('@aws-crypto/client-node');

    const { encrypt } = buildEncrypt();
    const { decrypt } = buildDecrypt();

    const keyring = new KmsKeyringNode({
      generatorKeyId: this.#options.keys[0],
      keyIds: this.#options.keys.slice(1),
    });

    const cache = getLocalCryptographicMaterialsCache(
      this.#options.localCacheCapacity ?? 100
    );

    this.#client = {
      encryptFn: encrypt,
      decryptFn: decrypt,
      cacheManager: new NodeCachingMaterialsManager({
        backingMaterials: keyring,
        cache,
        maxAge: (this.#options.maxCacheAgeSeconds ?? 300) * 1000,
        maxMessagesEncrypted: this.#options.maxMessagesEncrypted ?? 4294967296,
        maxBytesEncrypted:
          this.#options.maxBytesEncrypted ?? Number.MAX_SAFE_INTEGER,
      }),
    };

    return this.#client;
  }

  async encrypt(
    data: string,
    context?: Record<string, string>
  ): Promise<string> {
    const { encryptFn, cacheManager } = await this.#init();
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
    const { decryptFn, cacheManager } = await this.#init();
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

import type { buildDecrypt, buildEncrypt } from '@aws-crypto/client-node';
import type { EncryptionProvider } from '../types.js';

export interface AWSEncryptionSDKProviderOptions {
  keys: string[];
  localCacheCapacity?: number;
  maxCacheAgeSeconds?: number;
  maxMessagesEncrypted?: number;
  maxBytesEncrypted?: number;
}

type EncryptFn = ReturnType<typeof buildEncrypt>['encrypt'];
type DecryptFn = ReturnType<typeof buildDecrypt>['decrypt'];
type CacheManager = Parameters<EncryptFn>[0];

interface SDKClients {
  encryptFn: EncryptFn;
  decryptFn: DecryptFn;
  cacheManager: CacheManager;
}

export class AWSEncryptionSDKProvider implements EncryptionProvider {
  readonly #options: AWSEncryptionSDKProviderOptions;
  #clients?: SDKClients;

  constructor(options: AWSEncryptionSDKProviderOptions) {
    this.#options = options;
  }

  async #init(): Promise<SDKClients> {
    if (this.#clients) return this.#clients;

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

    this.#clients = {
      encryptFn: encrypt,
      decryptFn: decrypt,
      cacheManager: new NodeCachingMaterialsManager({
        backingMaterials: keyring,
        cache,
        maxAge: (this.#options.maxCacheAgeSeconds ?? 300) * 1000,
        maxMessagesEncrypted:
          this.#options.maxMessagesEncrypted ?? 4294967296,
        maxBytesEncrypted:
          this.#options.maxBytesEncrypted ?? Number.MAX_SAFE_INTEGER,
      }),
    };

    return this.#clients;
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
          throw new Error(
            `Encryption context mismatch for key '${key}'`
          );
        }
      }
    }

    return new TextDecoder().decode(plaintext);
  }
}

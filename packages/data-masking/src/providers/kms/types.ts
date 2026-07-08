import type { buildDecrypt, buildEncrypt } from '@aws-crypto/client-node';
import type { AWSEncryptionSDKProvider } from './AWSEncryptionSDKProvider.js';

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

/** Lazily assembled AWS Encryption SDK client functions and caching materials manager. */
export interface SDKClient {
  encryptFn: EncryptFn;
  decryptFn: DecryptFn;
  cacheManager: CacheManager;
}

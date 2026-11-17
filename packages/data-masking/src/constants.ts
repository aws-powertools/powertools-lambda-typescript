/**
 * The string that replaces values erased by the `DataMasking.erase()` method.
 */
export const DEFAULT_MASK_VALUE = '*****';

/**
 * Prefix of the encryption context keys reserved by the AWS Encryption SDK.
 *
 * The SDK stores `aws-crypto-public-key` in the encryption context when the algorithm
 * suite signs the message, which is the default. Keys with this prefix are left out of
 * the encryption context verification performed on decrypt.
 *
 * @internal
 */
export const RESERVED_ENCRYPTION_CONTEXT_PREFIX = 'aws-crypto-';

/**
 * Interface for pluggable encryption providers.
 * Implement this to use a custom encryption backend.
 */
export interface EncryptionProvider {
  encrypt(data: string, context?: Record<string, string>): Promise<string>;
  decrypt(data: string, context?: Record<string, string>): Promise<string>;
}

/** Options for the {@link DataMasking} constructor. */
export interface DataMaskingConstructorOptions {
  /** Encryption provider for encrypt/decrypt operations. */
  provider?: EncryptionProvider;
  /** Whether to throw when a field path doesn't match. Default: `true`. */
  throwOnMissingField?: boolean;
}

/** Per-field custom masking configuration for {@link DataMasking.erase}. */
export interface MaskingRule {
  /** Regex pattern to match within the field value. */
  regexPattern?: RegExp;
  /** Replacement format string (e.g., `'$1****$3'`). */
  maskFormat?: string;
  /** If true, mask length matches original value length. */
  dynamicMask?: boolean;
  /** Fixed replacement string. */
  customMask?: string;
}

/** Options for {@link DataMasking.erase}. */
export interface EraseOptions {
  /** JMESPath expressions for fields to mask. */
  fields?: string[];
  /** Per-field custom masking rules keyed by dot-notation path. */
  maskingRules?: Record<string, MaskingRule>;
}

/** Options for {@link DataMasking.encrypt}. */
export interface EncryptOptions {
  /** JMESPath expressions for fields to encrypt. If omitted, entire payload is encrypted. */
  fields?: string[];
  /** Encryption context (additional authenticated data). */
  context?: Record<string, string>;
  /** Provider-specific options (escape hatch). */
  providerOptions?: Record<string, unknown>;
}

/** Options for {@link DataMasking.decrypt}. */
export interface DecryptOptions {
  /** JMESPath expressions for fields to decrypt. */
  fields?: string[];
  /** Encryption context for verification. */
  context?: Record<string, string>;
  /** Provider-specific options (escape hatch). */
  providerOptions?: Record<string, unknown>;
}

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

/**
 * Per-field custom masking configuration for {@link DataMasking.erase}.
 *
 * The masking strategies are mutually exclusive: provide `regexPattern` together
 * with `maskFormat`, or `dynamicMask`, or `customMask`, or an empty rule (`{}`)
 * for the default mask value.
 */
export type MaskingRule =
  | {
      /** Regex pattern to match within the field value. */
      regexPattern: RegExp;
      /** Replacement format string (e.g., `'$1****$3'`). */
      maskFormat: string;
      dynamicMask?: never;
      customMask?: never;
    }
  | {
      /** If `true`, the mask length matches the original value length. */
      dynamicMask: true;
      regexPattern?: never;
      maskFormat?: never;
      customMask?: never;
    }
  | {
      /** Fixed replacement string. */
      customMask: string;
      regexPattern?: never;
      maskFormat?: never;
      dynamicMask?: never;
    }
  | {
      regexPattern?: never;
      maskFormat?: never;
      dynamicMask?: never;
      customMask?: never;
    };

/**
 * Options for {@link DataMasking.erase}.
 *
 * `fields` and `maskingRules` are mutually exclusive: provide one or the other.
 */
export type EraseOptions =
  | {
      /** Dot-notation path expressions for fields to mask (supports `.*` and `[*]` wildcards). */
      fields: string[];
      maskingRules?: never;
    }
  | {
      /** Per-field custom masking rules keyed by dot-notation path. */
      maskingRules: Record<string, MaskingRule>;
      fields?: never;
    };

/**
 * Return type of {@link DataMasking.erase} when called without options:
 * arrays are masked element-wise preserving length, `null` and `undefined`
 * pass through unchanged, and everything else collapses to the mask string.
 */
export type MaskedPayload<T> = T extends null | undefined
  ? T
  : T extends readonly unknown[]
    ? string[]
    : string;

/** Options for {@link DataMasking.encrypt}. */
export interface EncryptOptions {
  /** Dot-notation path expressions for fields to encrypt (supports `.*` and `[*]` wildcards). If omitted, entire payload is encrypted. */
  fields?: string[];
  /** Encryption context (additional authenticated data). */
  context?: Record<string, string>;
  /** Provider-specific options (escape hatch). */
  providerOptions?: Record<string, unknown>;
}

/** Options for {@link DataMasking.decrypt}. */
export interface DecryptOptions {
  /** Dot-notation path expressions for fields to decrypt (supports `.*` and `[*]` wildcards). */
  fields?: string[];
  /** Encryption context for verification. */
  context?: Record<string, string>;
  /** Provider-specific options (escape hatch). */
  providerOptions?: Record<string, unknown>;
}

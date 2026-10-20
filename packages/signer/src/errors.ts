/**
 * Base error for all errors thrown by the signer utility.
 *
 * Generally this error should not be thrown directly; prefer the more specific
 * {@link SignerConfigError | `SignerConfigError`} and
 * {@link RequestSigningError | `RequestSigningError`} subclasses.
 */
class SignerError extends Error {
  public constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = 'SignerError';
  }
}

/**
 * Error thrown when the signer is misconfigured.
 *
 * This is thrown eagerly at construction when the region cannot be determined,
 * and lazily during signing when credentials are missing or cannot be resolved.
 */
class SignerConfigError extends SignerError {
  public constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = 'SignerConfigError';
  }
}

/**
 * Error thrown when signing a request fails.
 *
 * This wraps errors thrown by the underlying signing process. The original
 * error, when available, is preserved on the `cause` property.
 */
class RequestSigningError extends SignerError {
  public constructor(message: string, options?: ErrorOptions) {
    const errorMessage =
      options?.cause instanceof Error
        ? `${message}. This error was caused by: ${options.cause.message}.`
        : message;
    super(errorMessage, options);
    this.name = 'RequestSigningError';
  }
}

export { RequestSigningError, SignerConfigError, SignerError };

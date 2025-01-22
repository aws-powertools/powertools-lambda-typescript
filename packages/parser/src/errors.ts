/**
 * Custom parsing error that wraps any erros thrown during schema or envelope parsing.
 * The cause of the error is included in the message, if possible.
 */
class ParseError extends Error {
  public constructor(message: string, options?: { cause?: Error }) {
    const errorMessage = options?.cause
      ? `${message}. This error was caused by: ${options?.cause.message}.`
      : message;
    super(errorMessage, options);
    this.name = 'ParseError';
  }
}

/**
 * Custom error thrown when decompression fails.
 */
class DecompressError extends ParseError {
  constructor(message: string, options?: { cause?: Error }) {
    super(message, options);
    this.name = 'DecompressError';
  }
}

export { ParseError, DecompressError };

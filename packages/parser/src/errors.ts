/**
 * Custom parsing error that wraps any erros thrown during schema or envelope parsing.
 * The cause of the error is included in the message, if possible.
 */
class ParseError extends Error {
  public constructor(message: string, options?: ErrorOptions) {
    const errorMessage =
      options?.cause && options.cause instanceof Error
        ? `${message}. This error was caused by: ${options?.cause.message}.`
        : message;
    super(errorMessage, options);
    this.name = 'ParseError';
  }
}

export { ParseError };

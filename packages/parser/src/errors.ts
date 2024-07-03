/**
 * Custom parsing error that wraps any erros thrown during schema or envelope parsing.
 * The cause of the error is included in the message, if possible.
 */
class ParseError extends Error {
  public constructor(message: string, options?: { cause?: Error }) {
    const errorMessage = options?.cause
      ? `${message}. This error was caused by: ${options?.cause.message}.`
      : message;
    super(errorMessage);
    this.name = 'ParseError';
  }
}

export { ParseError };

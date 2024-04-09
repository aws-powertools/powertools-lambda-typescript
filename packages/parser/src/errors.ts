/**
 * Error thrown when a parsing error occurs. The cause of the error is included in the message, if possible.
 */
class ParseError extends Error {
  /**
   * we use the `cause` property, which is present in ES2022 or newer, to store the cause of the error.
   * because we have to support Node 16.x, we need to add this property ourselves.
   * We can remove this once we drop support for Node 16.x.
   * see: https://github.com/aws-powertools/powertools-lambda-typescript/issues/2223
   *
   * @see https://nodejs.org/api/errors.html#errors_error_cause
   */
  public readonly cause: Error | undefined;

  public constructor(message: string, cause?: Error) {
    const errorMessage = cause
      ? `${message}. This error was caused by: ${cause.message}.`
      : message;
    super(errorMessage);
    this.cause = cause;
    this.name = 'ParseError';
  }
}

export { ParseError };

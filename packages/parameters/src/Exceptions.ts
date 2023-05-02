class GetParameterError extends Error {}

/**
 * Error thrown when a transform fails.
 */
class TransformParameterError extends Error {
  public constructor(transform: string, message: string) {
    super(message);

    this.message = `Unable to transform value using '${transform}' transform: ${message}`;
  }
}

export { GetParameterError, TransformParameterError };

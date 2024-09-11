/**
 * Error thrown when a parameter cannot be retrieved.
 */
class GetParameterError extends Error {
  public constructor(message?: string) {
    super(message);
    this.name = 'GetParameterError';
  }
}

/**
 * Error thrown when a parameter cannot be set.
 */
class SetParameterError extends Error {
  public constructor(message?: string) {
    super(message);
    this.name = 'SetParameterError';
  }
}

/**
 * Error thrown when a transform fails.
 */
class TransformParameterError extends Error {
  public constructor(transform: string, message: string) {
    super(message);
    this.name = 'TransformParameterError';
    this.message = `Unable to transform value using '${transform}' transform: ${message}`;
  }
}

export { GetParameterError, TransformParameterError, SetParameterError };

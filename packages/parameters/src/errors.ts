/**
 * Error thrown when a parameter cannot be retrieved.
 *
 * You can use this error to catch and handle errors when getting a parameter, the `cause` property will contain the original error.
 */
class GetParameterError extends Error {
  public constructor(message?: string, options?: ErrorOptions) {
    super(message, options);
    this.name = 'GetParameterError';
  }
}

/**
 * Error thrown when a parameter cannot be set.
 *
 * You can use this error to catch and handle errors when setting a parameter, the `cause` property will contain the original error.
 */
class SetParameterError extends Error {
  public constructor(message?: string, options?: ErrorOptions) {
    super(message, options);
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

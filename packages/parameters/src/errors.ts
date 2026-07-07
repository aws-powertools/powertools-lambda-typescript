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
 * Error thrown when a parameter is not found in the store.
 *
 * For provider-based functions this error is thrown only when the `throwOnMissing` option is
 * set to `true` and the requested parameter does not exist (i.e. the store returned `null` or
 * `undefined`). The `getConfig` function from the `appconfig-agent` module always throws it
 * when the AWS AppConfig Agent reports that the requested configuration does not exist.
 *
 * It extends {@link GetParameterError | `GetParameterError`}, so you can catch it with either
 * `instanceof ParameterNotFoundError` to handle a missing parameter specifically, or
 * `instanceof GetParameterError` to handle any retrieval failure.
 *
 * Unlike `GetParameterError`, this error has no `cause`: nothing failed, the parameter simply
 * does not exist.
 */
class ParameterNotFoundError extends GetParameterError {
  public constructor(message?: string, options?: ErrorOptions) {
    super(message, options);
    this.name = 'ParameterNotFoundError';
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

export {
  GetParameterError,
  ParameterNotFoundError,
  SetParameterError,
  TransformParameterError,
};

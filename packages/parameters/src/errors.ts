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
 * This error is thrown only when the `throwOnMissing` option is set to `true` and the
 * requested parameter does not exist (i.e. the store returned `null` or `undefined`).
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
 * The {@link getConfig | `getConfig()`} function throws this error when `throwOnMissing` is set and the AppConfig Agent reports that one or more requested flags do not exist.
 *
 * The `flags` property lists the missing flag names.
 * It extends {@link ParameterNotFoundError | `ParameterNotFoundError`}, so existing catch blocks keep working.
 * Use `instanceof FlagNotFoundError` to distinguish missing flags from a missing configuration.
 *
 * @example
 * ```typescript
 * import { FlagNotFoundError } from '@aws-lambda-powertools/parameters/errors';
 *
 * if (error instanceof FlagNotFoundError) {
 *   console.warn('Use fallback for missing flags', error.flags);
 * }
 * ```
 */
class FlagNotFoundError extends ParameterNotFoundError {
  public readonly flags: readonly string[];

  public constructor(
    message: string,
    flags: readonly string[],
    options?: ErrorOptions
  ) {
    super(message, options);
    this.name = 'FlagNotFoundError';
    this.flags = flags;
  }
}

/**
 * Represents the error that `getConfig` throws when the AppConfig Agent responds with a non-success HTTP status other than 404.
 *
 * A structured HTTP 400 `NoSuchFlag` response with requested flags returns `undefined`, or throws a {@link FlagNotFoundError | `FlagNotFoundError`} when `throwOnMissing` is set.
 *
 * The `statusCode` property holds the HTTP status returned by the agent.
 * It extends {@link GetParameterError | `GetParameterError`}, so existing catch blocks keep working.
 *
 * @example
 * ```typescript
 * import { AppConfigAgentError } from '@aws-lambda-powertools/parameters/errors';
 *
 * if (error instanceof AppConfigAgentError && error.statusCode >= 500) {
 *   console.error('AppConfig Agent is unavailable', error);
 * }
 * ```
 */
class AppConfigAgentError extends GetParameterError {
  public readonly statusCode: number;

  public constructor(
    message: string,
    statusCode: number,
    options?: ErrorOptions
  ) {
    super(message, options);
    this.name = 'AppConfigAgentError';
    this.statusCode = statusCode;
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
  AppConfigAgentError,
  FlagNotFoundError,
  GetParameterError,
  ParameterNotFoundError,
  SetParameterError,
  TransformParameterError,
};

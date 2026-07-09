import { ParseError } from './errors.js';
import type { ErrorHandler } from './types/parser.js';

/**
 * Sentinel returned by {@link invokeErrorHandler} when the error should be rethrown, either because
 * no errorHandler was provided, the error wasn't a {@link ParseError}, or the errorHandler itself
 * returned `undefined`.
 */
const NO_RECOVERY = Symbol('NO_RECOVERY');

/**
 * Invoke the customer-provided errorHandler, if any, for a parse failure.
 *
 * Returns {@link NO_RECOVERY} when the caller should rethrow the original error, or the
 * errorHandler's return value when it should be used to recover instead.
 */
function invokeErrorHandler<TErrorHandlerReturn>(
  errorHandler: ErrorHandler<TErrorHandlerReturn> | undefined,
  error: unknown,
  event: unknown
): TErrorHandlerReturn | typeof NO_RECOVERY {
  if (!errorHandler || !(error instanceof ParseError)) {
    return NO_RECOVERY;
  }

  const result = errorHandler(error, event);
  if (
    typeof result === 'object' &&
    result !== null &&
    typeof (result as { then?: unknown }).then === 'function'
  ) {
    throw new TypeError(
      'errorHandler must return synchronously; async errorHandler functions are not supported'
    );
  }

  // Only undefined triggers NO_RECOVERY; null is a valid recovery value per the
  // public ErrorHandler contract, so this must stay an explicit check rather than ??.
  if (result === undefined) {
    return NO_RECOVERY;
  }

  return result;
}

export { invokeErrorHandler, NO_RECOVERY };

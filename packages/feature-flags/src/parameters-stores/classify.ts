import { isRecord } from '@aws-lambda-powertools/commons';
import {
  AppConfigAgentError,
  GetParameterError,
  ParameterNotFoundError,
} from '@aws-lambda-powertools/parameters/errors';
import {
  AvailabilityErrorCodes,
  AvailabilityErrorNames,
} from '../constants.js';

/**
 * Classifies Parameters retrieval failures using structured fields only.
 *
 * Agent HTTP 5xx and 429 responses identify an unavailable store; other statuses
 * identify configuration failures. Missing parameters always propagate, even
 * when their cause resembles an outage. Transform errors and unrelated errors
 * also propagate because they are not retrieval errors.
 *
 * For a plain GetParameterError, a TypeError cause identifies a failed fetch.
 * Timeout, abort, throttling, internal server, and service unavailable names,
 * Node network codes, and SDK HTTP 5xx or 429 metadata identify an outage.
 * All other causes, including access denial, missing resources, bad requests,
 * other HTTP statuses, and absent causes, propagate unchanged.
 *
 * @param error - Supply the Parameters error to classify
 * @internal
 */
const isAvailabilityFailure = (error: unknown): boolean => {
  if (error instanceof AppConfigAgentError) {
    return error.statusCode >= 500 || error.statusCode === 429;
  }
  if (
    !(error instanceof GetParameterError) ||
    error instanceof ParameterNotFoundError
  ) {
    return false;
  }
  const cause = error.cause;
  if (cause instanceof TypeError) return true;
  // isRecord excludes native Errors, so accept those through their own type guard.
  if (!(cause instanceof Error) && !isRecord(cause)) return false;
  if (AvailabilityErrorNames.some((name) => cause.name === name)) return true;
  if (
    'code' in cause &&
    AvailabilityErrorCodes.some((code) => cause.code === code)
  )
    return true;
  if ('$metadata' in cause && isRecord(cause.$metadata)) {
    const statusCode = cause.$metadata.httpStatusCode;
    return (
      typeof statusCode === 'number' &&
      (statusCode >= 500 || statusCode === 429)
    );
  }
  return false;
};

export { isAvailabilityFailure };

/**
 * Get the original cause of the error if it is a `SchemaValidationError`.
 *
 * This is useful so that we don't rethrow the same error type.
 *
 * @param error - The error to extract the cause from.
 */
const getErrorCause = (error: unknown): unknown => {
  let cause = error;
  if (error instanceof Error && error.name === 'SchemaValidationError') {
    cause = error.cause;
  }
  return cause;
};

export { getErrorCause };

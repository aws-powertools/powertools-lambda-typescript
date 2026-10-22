import { ZodError, type ZodType, type z } from 'zod';
import { ParseError } from '../errors.js';

/**
 * This is a discriminator to differentiate whether an envelope returns an array or an object
 * @hidden
 */
const envelopeDiscriminator = Symbol.for('returnType');

/**
 * Prefixes the path of every issue in a `ZodError` with the location of the payload inside the event.
 *
 * Any other error, such as one thrown by a schema transform, is returned unchanged so it stays available as the cause.
 *
 * @param error - the error thrown while parsing the payload
 * @param path - the path of the payload inside the event
 */
const prefixIssuePaths = (error: unknown, path: PropertyKey[]): unknown =>
  error instanceof ZodError
    ? new ZodError(
        error.issues.map((issue) => ({
          ...issue,
          path: [...path, ...issue.path],
        }))
      )
    : error;

/**
 * Parses the data with the schema, and throws a `ParseError` with the given message when parsing fails.
 *
 * The original error is kept as the cause. When a path is given, the issue paths of a `ZodError` are
 * prefixed with it through {@link prefixIssuePaths | `prefixIssuePaths`}.
 *
 * @param schema - the schema to parse the data with
 * @param data - the data to parse
 * @param message - the message of the `ParseError` thrown when parsing fails
 * @param path - the path of the data inside the event
 */
const parseOrThrow = <T>(
  schema: ZodType<T>,
  data: unknown,
  message: string,
  path?: PropertyKey[]
): T => {
  try {
    return schema.parse(data);
  } catch (error) {
    throw new ParseError(message, {
      cause: path === undefined ? error : prefixIssuePaths(error, path),
    });
  }
};

/**
 * Result of {@link safeParseWithCause | `safeParseWithCause`}.
 *
 * On failure, `error` is either a `ZodError` or the value thrown by a schema transform.
 */
type SafeParseWithCauseResult<T> =
  | { success: true; data: T }
  | { success: false; error: unknown };

/**
 * Parses the data with the schema, and returns a failed result instead of throwing.
 *
 * Zod's `safeParse` rethrows errors thrown inside a schema transform, so the call runs in a `try` and a thrown
 * error becomes a failed result that keeps it unchanged. When a path is given, the issue paths of a `ZodError`
 * are prefixed with it through {@link prefixIssuePaths | `prefixIssuePaths`}.
 *
 * @param schema - the schema to parse the data with
 * @param data - the data to parse
 * @param path - the path of the data inside the event
 */
const safeParseWithCause = <T>(
  schema: ZodType<T>,
  data: unknown,
  path?: PropertyKey[]
): SafeParseWithCauseResult<T> => {
  try {
    const result = schema.safeParse(data);
    if (result.success) {
      return { success: true, data: result.data };
    }

    return {
      success: false,
      error:
        path === undefined
          ? result.error
          : prefixIssuePaths(result.error, path),
    };
  } catch (error) {
    return { success: false, error };
  }
};

/**
 * Merges the errors of the records that failed to parse into the cause of a single `ParseError`.
 *
 * The issues of every `ZodError` are merged into one `ZodError`. If a record failed because a schema transform
 * threw, the first such error is returned instead, so the original error stays available as the cause.
 *
 * @param errors - the errors of the records that failed to parse, in record order
 */
const mergeRecordErrors = (errors: unknown[]): unknown => {
  const issues: z.core.$ZodIssue[] = [];
  for (const error of errors) {
    if (!(error instanceof ZodError)) {
      return error;
    }
    issues.push(...error.issues);
  }

  return new ZodError(issues);
};

export type { SafeParseWithCauseResult };
export {
  envelopeDiscriminator,
  mergeRecordErrors,
  parseOrThrow,
  prefixIssuePaths,
  safeParseWithCause,
};

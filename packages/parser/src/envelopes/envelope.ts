import { ZodError, type ZodType } from 'zod';
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

export { envelopeDiscriminator, parseOrThrow, prefixIssuePaths };

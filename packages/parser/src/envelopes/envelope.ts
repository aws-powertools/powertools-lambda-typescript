import { ZodError } from 'zod';

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

export { envelopeDiscriminator, prefixIssuePaths };

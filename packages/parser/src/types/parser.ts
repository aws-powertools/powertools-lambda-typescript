import type { ZodSchema, ZodError } from 'zod';
import type { Envelope } from './envelope.js';

/**
 * Options for the parser used in middy middleware and decorator
 */
type ParserOptions<S extends ZodSchema> = {
  schema: S;
  envelope?: Envelope;
  safeParse?: boolean;
};

/**
 * A successful parsing result with the parsed data when using safeParse
 */
type ParsedResultSuccess<Output> = {
  success: true;
  data: Output;
};

/**
 * A failed parsing result with the error when using safeParse, contains the original event and the error.
 */
type ParsedResultError<Input> = {
  success: false;
  error: ZodError | Error;
  originalEvent: Input;
};

/**
 * The result of parsing an event using the safeParse, can either be a success or an error
 */
type ParsedResult<Input = unknown, Output = unknown> =
  | ParsedResultSuccess<Output>
  | ParsedResultError<Input>;

export type {
  ParserOptions,
  ParsedResult,
  ParsedResultError,
  ParsedResultSuccess,
};

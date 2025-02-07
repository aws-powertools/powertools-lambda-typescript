import type { ZodError, ZodSchema, z } from 'zod';
import type { ArrayEnvelope, Envelope } from './envelope.js';

/**
 * Options for the parser used in middy middleware and decorator
 */
type ParserOptions<
  TSchema extends ZodSchema,
  TEnvelope extends Envelope,
  TSafeParse extends boolean,
> = {
  schema: TSchema;
  envelope?: TEnvelope;
  safeParse?: TSafeParse;
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
  originalEvent?: Input;
};

/**
 * The result of parsing an event using the safeParse, can either be a success or an error
 */
type ParsedResult<Input = unknown, Output = Input> =
  | ParsedResultSuccess<Output>
  | ParsedResultError<Input>;

/**
 * The inferred result of the schema, can be either an array or a single object depending on the envelope
 */
type ZodInferredResult<
  TSchema extends ZodSchema,
  TEnvelope extends Envelope,
> = undefined extends TEnvelope
  ? z.infer<TSchema>
  : TEnvelope extends ArrayEnvelope
    ? z.infer<TSchema>[]
    : z.infer<TSchema>;

type ZodInferredSafeParseResult<
  TSchema extends ZodSchema,
  TEnvelope extends Envelope,
> = undefined extends TEnvelope
  ? ParsedResult<z.infer<TSchema>, z.infer<TSchema>>
  : TEnvelope extends ArrayEnvelope
    ? ParsedResult<unknown, z.infer<TSchema>[]>
    : ParsedResult<unknown, z.infer<TSchema>>;

/**
 * The output of the parser function, can be either schema inferred type or a ParsedResult
 */
type ParserOutput<
  TSchema extends ZodSchema,
  TEnvelope extends Envelope,
  TSafeParse = false,
> = TSafeParse extends true
  ? ZodInferredSafeParseResult<TSchema, TEnvelope>
  : ZodInferredResult<TSchema, TEnvelope>;

export type {
  ParserOptions,
  ParsedResult,
  ParsedResultError,
  ParsedResultSuccess,
  ParserOutput,
};

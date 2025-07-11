import type { StandardSchemaV1 } from '@standard-schema/spec';
import type { ArrayEnvelope, Envelope } from './envelope.js';

/**
 * Options for the parser used in middy middleware and decorator
 */
type ParserOptions<
  TSchema extends StandardSchemaV1,
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
  error: unknown | Error;
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
  TSchema extends StandardSchemaV1,
  TEnvelope extends Envelope,
> = undefined extends TEnvelope
  ? InferOutput<TSchema>
  : TEnvelope extends ArrayEnvelope
    ? InferOutput<TSchema>[]
    : InferOutput<TSchema>;

type ZodInferredSafeParseResult<
  TSchema extends StandardSchemaV1,
  TEnvelope extends Envelope,
> = undefined extends TEnvelope
  ? ParsedResult<InferOutput<TSchema>, InferOutput<TSchema>>
  : TEnvelope extends ArrayEnvelope
    ? ParsedResult<unknown, InferOutput<TSchema>[]>
    : ParsedResult<unknown, InferOutput<TSchema>>;

/**
 * The output of the parser function, can be either schema inferred type or a ParsedResult
 */
type ParserOutput<
  TSchema extends StandardSchemaV1,
  TEnvelope extends Envelope,
  TSafeParse = false,
> = TSafeParse extends true
  ? ZodInferredSafeParseResult<TSchema, TEnvelope>
  : ZodInferredResult<TSchema, TEnvelope>;

/**
 * The parser function that can parse the data using the provided schema and envelope
 * we use function overloads to provide the correct return type based on the provided envelope
 **/
type ParseFunction = {
  // No envelope cases
  <T extends StandardSchemaV1>(
    data: InferOutput<T>,
    envelope: undefined,
    schema: T,
    safeParse?: false
  ): InferOutput<T>;

  <T extends StandardSchemaV1>(
    data: InferOutput<T>,
    envelope: undefined,
    schema: T,
    safeParse: true
  ): ParsedResult<InferOutput<T>>;

  // Generic envelope case
  <T extends StandardSchemaV1, E extends Envelope>(
    data: unknown,
    envelope: E,
    schema: T,
    safeParse?: false
  ): E extends ArrayEnvelope ? InferOutput<T>[] : InferOutput<T>;

  <T extends StandardSchemaV1, E extends Envelope>(
    data: unknown,
    envelope: E,
    schema: T,
    safeParse: true
  ): E extends ArrayEnvelope
    ? ParsedResult<unknown, InferOutput<T>[]>
    : ParsedResult<unknown, InferOutput<T>>;

  // Generic envelope case with safeParse
  <T extends StandardSchemaV1, E extends Envelope, S extends boolean = false>(
    data: unknown,
    envelope: E,
    schema: T,
    safeParse?: S
  ): S extends true
    ? E extends ArrayEnvelope
      ? ParsedResult<unknown, InferOutput<T>[]>
      : ParsedResult<unknown, InferOutput<T>>
    : E extends ArrayEnvelope
      ? InferOutput<T>[]
      : InferOutput<T>;
};

type InferOutput<Schema extends StandardSchemaV1> = NonNullable<
  Schema['~standard']['types']
>['output'];

export type {
  ParseFunction,
  InferOutput,
  ParsedResult,
  ParsedResultError,
  ParsedResultSuccess,
  ParserOptions,
  ParserOutput,
};

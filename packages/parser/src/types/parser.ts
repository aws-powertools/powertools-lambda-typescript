import type { StandardSchemaV1 } from '@standard-schema/spec';
import type { ParseError } from '../errors.js';
import type {
  ArrayEnvelope,
  DynamoDBArrayEnvelope,
  DynamoDBStreamEnvelopeResponse,
  Envelope,
} from './envelope.js';

/**
 * A callback invoked when parsing fails with a {@link ParseError}, receiving the error and the original,
 * unparsed event. Returning a value short-circuits the parse failure with that value; returning `undefined`
 * rethrows the error. The callback must be synchronous - returning a `Promise` is a type error.
 */
type ErrorHandler<TErrorHandlerReturn> = (
  error: ParseError,
  event: unknown
) => TErrorHandlerReturn extends Promise<unknown> ? never : TErrorHandlerReturn;

type ParserOptionsBase<
  TSchema extends StandardSchemaV1,
  TEnvelope extends Envelope,
> = {
  schema: TSchema;
  envelope?: TEnvelope;
};

/**
 * Options for the parser used in middy middleware and decorator.
 *
 * `safeParse` and `errorHandler` are mutually exclusive: with `safeParse` the parser never throws,
 * so an `errorHandler` would never be invoked.
 */
type ParserOptions<
  TSchema extends StandardSchemaV1,
  TEnvelope extends Envelope,
  TSafeParse extends boolean,
  TErrorHandlerReturn = unknown,
> = ParserOptionsBase<TSchema, TEnvelope> &
  (TSafeParse extends true
    ? { safeParse: TSafeParse; errorHandler?: never }
    : {
        safeParse?: TSafeParse;
        errorHandler?: ErrorHandler<TErrorHandlerReturn>;
      });

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
  error: Error;
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
  : TEnvelope extends DynamoDBArrayEnvelope
    ? DynamoDBStreamEnvelopeResponse<InferOutput<TSchema>>[]
    : TEnvelope extends ArrayEnvelope
      ? InferOutput<TSchema>[]
      : InferOutput<TSchema>;

type ZodInferredSafeParseResult<
  TSchema extends StandardSchemaV1,
  TEnvelope extends Envelope,
> = undefined extends TEnvelope
  ? ParsedResult<InferOutput<TSchema>, InferOutput<TSchema>>
  : TEnvelope extends DynamoDBArrayEnvelope
    ? ParsedResult<
        unknown,
        DynamoDBStreamEnvelopeResponse<InferOutput<TSchema>>[]
      >
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
 */
type ParseFunction = {
  // No envelope, no safeParse
  <T extends StandardSchemaV1>(
    data: unknown,
    envelope: undefined,
    schema: T,
    safeParse?: false
  ): InferOutput<T>;

  // No envelope, with safeParse
  <T extends StandardSchemaV1>(
    data: unknown,
    envelope: undefined,
    schema: T,
    safeParse: true
  ): ParsedResult<unknown, InferOutput<T>>;

  // With envelope, no safeParse
  <T extends StandardSchemaV1, E extends Envelope>(
    data: unknown,
    envelope: E,
    schema: T,
    safeParse?: false
  ): E extends DynamoDBArrayEnvelope
    ? DynamoDBStreamEnvelopeResponse<InferOutput<T>>[]
    : E extends ArrayEnvelope
      ? InferOutput<T>[]
      : InferOutput<T>;

  // With envelope, with safeParse
  <T extends StandardSchemaV1, E extends Envelope>(
    data: unknown,
    envelope: E,
    schema: T,
    safeParse: true
  ): E extends DynamoDBArrayEnvelope
    ? ParsedResult<unknown, DynamoDBStreamEnvelopeResponse<InferOutput<T>>[]>
    : E extends ArrayEnvelope
      ? ParsedResult<unknown, InferOutput<T>[]>
      : ParsedResult<unknown, InferOutput<T>>;
};

type InferOutput<Schema extends StandardSchemaV1> = NonNullable<
  Schema['~standard']['types']
>['output'];

export type {
  ErrorHandler,
  InferOutput,
  ParsedResult,
  ParsedResultError,
  ParsedResultSuccess,
  ParseFunction,
  ParserOptions,
  ParserOutput,
};

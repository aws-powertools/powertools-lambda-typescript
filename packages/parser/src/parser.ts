import type { StandardSchemaV1 } from '@standard-schema/spec';
import { ParseError } from './errors.js';
import type {
  ArrayEnvelope,
  DynamoDBArrayEnvelope,
  DynamoDBStreamEnvelopeResponse,
  Envelope,
} from './types/index.js';
import type { InferOutput, ParsedResult } from './types/parser.js';

/**
 * Parse the data using the provided schema and optional envelope.
 *
 * @example
 * ```typescript
 * import { z } from 'zod';
 * import type { SqsEvent, ParsedResult } from '@aws-lambda-powertools/parser/types';
 * import { SqsEnvelope } from '@aws-lambda-powertools/parser/types/envelopes';
 * import { parse } from '@aws-lambda-powertools/parser';
 *
 * const Order = z.object({
 *   orderId: z.string(),
 *   description: z.string(),
 * });
 *
 * const handler = async (event: SqsEvent, context: unknown): Promise<unknown> => {
 *   const parsedEvent = parse(event, SqsEnvelope, Order);
 * }
 * ```
 *
 * @param data - the data to parse
 * @param envelope - optional envelope to use when parsing the data
 * @param schema - the schema to use
 * @param safeParse - whether to throw on error, if `true` it will return a `ParsedResult` with the original event if the parsing fails
 */
function parse<T extends StandardSchemaV1>(
  data: unknown,
  envelope: undefined,
  schema: T,
  safeParse?: false
): InferOutput<T>;

// No envelope, with safeParse
function parse<T extends StandardSchemaV1>(
  data: unknown,
  envelope: undefined,
  schema: T,
  safeParse: true
): ParsedResult<unknown, InferOutput<T>>;

// No envelope, with boolean safeParse
function parse<T extends StandardSchemaV1>(
  data: unknown,
  envelope: undefined,
  schema: T,
  safeParse: boolean
): InferOutput<T> | ParsedResult<unknown, InferOutput<T>>;

// With envelope, no safeParse
function parse<T extends StandardSchemaV1, E extends Envelope>(
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
function parse<T extends StandardSchemaV1, E extends Envelope>(
  data: unknown,
  envelope: E,
  schema: T,
  safeParse: true
): E extends DynamoDBArrayEnvelope
  ? ParsedResult<unknown, DynamoDBStreamEnvelopeResponse<InferOutput<T>>[]>
  : E extends ArrayEnvelope
    ? ParsedResult<unknown, InferOutput<T>[]>
    : ParsedResult<unknown, InferOutput<T>>;

// No envelope, with boolean | undefined safeParse
function parse<T extends StandardSchemaV1>(
  data: unknown,
  envelope: undefined,
  schema: T,
  safeParse?: boolean
): InferOutput<T> | ParsedResult<unknown, InferOutput<T>>;

// With envelope, with boolean | undefined safeParse
function parse<T extends StandardSchemaV1, E extends Envelope>(
  data: unknown,
  envelope: E,
  schema: T,
  safeParse?: boolean
): E extends DynamoDBArrayEnvelope
  ?
      | DynamoDBStreamEnvelopeResponse<InferOutput<T>>[]
      | ParsedResult<unknown, DynamoDBStreamEnvelopeResponse<InferOutput<T>>[]>
  : E extends ArrayEnvelope
    ? InferOutput<T>[] | ParsedResult<unknown, InferOutput<T>[]>
    : InferOutput<T> | ParsedResult<unknown, InferOutput<T>>;

// Implementation
function parse<T extends StandardSchemaV1, E extends Envelope>(
  data: unknown,
  envelope: E | undefined,
  schema: T,
  safeParse?: boolean
): InferOutput<T> | ParsedResult<unknown, InferOutput<T>> {
  if (envelope && safeParse) {
    // biome-ignore lint/suspicious/noExplicitAny: at least for now, we need to broaden the type because the envelope's parse and safeParse methods are not typed with StandardSchemaV1 but with ZodSchema
    return envelope.safeParse(data, schema as any);
  }
  if (envelope) {
    // biome-ignore lint/suspicious/noExplicitAny: at least for now, we need to broaden the type because the envelope's parse and safeParse methods are not typed with StandardSchemaV1 but with ZodSchema
    return envelope.parse(data, schema as any);
  }

  const result = schema['~standard'].validate(data);
  /* v8 ignore start */
  if (result instanceof Promise) {
    throw new ParseError('Schema parsing supports only synchronous validation');
  }
  /* v8 ignore stop */

  if (result.issues) {
    const error = new ParseError('Failed to parse schema', {
      cause: result.issues,
    });
    if (safeParse) {
      return {
        success: false,
        error,
        originalEvent: data,
      };
    }
    throw error;
  }

  if (safeParse) {
    return {
      success: true,
      data: result.value,
    };
  }

  return result.value;
}

export { parse };

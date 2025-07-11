import type { StandardSchemaV1 } from '@standard-schema/spec';
import { ParseError } from './errors.js';
import type { Envelope } from './types/index.js';
import type {
  InferOutput,
  ParsedResult,
  ParseFunction,
} from './types/parser.js';

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
 *
 *   const parsedSafe: ParsedResult<SqsEnvelope> = parse(event, SqsEnvelope, Order, true)
 * }
 * ```
 *
 * @param data - the data to parse
 * @param envelope - optional envelope to use when parsing the data
 * @param schema - the schema to use
 * @param safeParse - whether to throw on error, if `true` it will return a `ParsedResult` with the original event if the parsing fails
 */
const parse: ParseFunction = <T extends StandardSchemaV1, E extends Envelope>(
  data: InferOutput<T>,
  envelope: E | undefined,
  schema: T,
  safeParse?: boolean
) => {
  if (envelope && safeParse) {
    return envelope.safeParse(data, schema);
  }
  if (envelope) {
    return envelope.parse(data, schema);
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
      } as ParsedResult<unknown, InferOutput<T>>;
    }
    throw error;
  }
  if (safeParse) {
    return {
      success: true,
      data: result.value,
    } as ParsedResult<unknown, InferOutput<T>>;
  }
  return result.value;
};

export { parse };

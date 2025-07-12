import type { MiddyLikeRequest } from '@aws-lambda-powertools/commons/types';
import type { MiddlewareObj } from '@middy/core';
import type { StandardSchemaV1 } from '@standard-schema/spec';
import { parse } from '../parser.js';
import type { Envelope } from '../types/envelope.js';
import type { ParserOptions, ParserOutput } from '../types/parser.js';

/**
 * A Middy.js middleware to parse incoming events using a specified schema and optional envelope.
 *
 * @example
 * ```typescript
 * import { parser } from '@aws-lambda-powertools/parser/middleware';
 * import middy from '@middy/core';
 * import { sqsEnvelope } from '@aws-lambda-powertools/parser/envelopes/sqs;'
 *
 * const oderSchema = z.object({
 *   id: z.number(),
 *   description: z.string(),
 *   quantity: z.number(),
 * });
 *
 * type Order = z.infer<typeof oderSchema>;
 *
 * export const handler = middy()
 *   .use(parser({ schema: oderSchema, envelope: sqsEnvelope }))
 *   .handler(async (event) => {
 *            // ^ event is inferred as Order[]
 *   })
 * ```
 *
 * @param options - options for the parser
 */
const parser = <
  TSchema extends StandardSchemaV1,
  TEnvelope extends Envelope,
  TSafeParse extends boolean = false,
>(
  options: ParserOptions<TSchema, TEnvelope, TSafeParse>
): MiddlewareObj<ParserOutput<TSchema, TEnvelope, TSafeParse>> => {
  const before = (request: MiddyLikeRequest): void => {
    const { schema, envelope, safeParse } = options;

    request.event = parse(request.event, envelope, schema, safeParse);
  };

  return {
    before,
  };
};

export { parser };

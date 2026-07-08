import type { MiddyLikeRequest } from '@aws-lambda-powertools/commons/types';
import type { MiddlewareObj } from '@middy/core';
import type { StandardSchemaV1 } from '@standard-schema/spec';
import { invokeErrorHandler, NO_RECOVERY } from '../errorHandler.js';
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
 * import { SqsEnvelope } from '@aws-lambda-powertools/parser/envelopes/sqs';
 *
 * const orderSchema = z.object({
 *   id: z.number(),
 *   description: z.string(),
 *   quantity: z.number(),
 * });
 *
 * type Order = z.infer<typeof orderSchema>;
 *
 * export const handler = middy()
 *   .use(parser({ schema: orderSchema, envelope: SqsEnvelope }))
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
  TErrorHandlerReturn = never,
>(
  options: ParserOptions<TSchema, TEnvelope, TSafeParse, TErrorHandlerReturn>
): MiddlewareObj<
  ParserOutput<TSchema, TEnvelope, TSafeParse>,
  | ParserOutput<TSchema, TEnvelope, TSafeParse>
  | Exclude<TErrorHandlerReturn, undefined>
> => {
  // Tracks which requests failed in *this* middleware's own `before` phase, so `onError`
  // only recovers this parser's own parse failures - not an unrelated ParseError thrown
  // by the handler or another parser middleware further down the chain.
  const failedRequests = new WeakSet<MiddyLikeRequest>();

  const before = (request: MiddyLikeRequest): void => {
    const { schema, envelope, safeParse } = options;

    try {
      request.event = parse(request.event, envelope, schema, safeParse);
    } catch (error) {
      failedRequests.add(request);
      throw error;
    }
  };

  const onError = (request: MiddyLikeRequest): void => {
    if (!failedRequests.has(request)) {
      return;
    }

    const result = invokeErrorHandler(
      options.errorHandler,
      request.error,
      request.event
    );
    if (result !== NO_RECOVERY) {
      request.response = result;
    }
  };

  return {
    before,
    onError,
  };
};

export { parser };

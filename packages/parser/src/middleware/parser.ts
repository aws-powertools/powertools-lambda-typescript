import { MiddyLikeRequest } from '@aws-lambda-powertools/commons/types';
import { MiddlewareObj } from '@middy/core';
import { ZodSchema } from 'zod';
import { Envelope } from '../types/envelope.js';

interface ParserOptions<S extends ZodSchema> {
  schema: S;
  envelope?: Envelope;
}

/**
 * A middiy middleware to parse your event.
 *
 * @exmaple
 * ```typescirpt
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
 * export const handler = middy(
 *   async (event: Order, _context: unknown): Promise<void> => {
 *     // event is validated as sqs message envelope
 *     // the body is unwrapped and parsed into object ready to use
 *     // you can now use event as Order in your code
 *   }
 * ).use(parser({ schema: oderSchema, envelope: sqsEnvelope }));
 * ```
 *
 * @param options
 */
const parser = <S extends ZodSchema>(
  options: ParserOptions<S>
): MiddlewareObj => {
  const before = (request: MiddyLikeRequest): void => {
    const { schema, envelope } = options;
    if (envelope) {
      request.event = envelope(request.event, schema);
    } else {
      request.event = schema.parse(request.event);
    }
  };

  return {
    before,
  };
};

export { parser };

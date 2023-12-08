import { MiddyLikeRequest } from '@aws-lambda-powertools/commons/types';
import { MiddlewareObj } from '@middy/core';
import { ZodSchema } from 'zod';
import { Envelope } from '../envelopes/Envelope.js';

interface ParserOptions<S extends ZodSchema, E extends Envelope> {
  schema: S;
  envelope?: E;
}

/**
 * A middiy middleware to parse your event.
 *
 * @exmaple
 * ```typescirpt
 * import { parser } from '@aws-lambda-powertools/parser/middleware';
 * import middy from '@middy/core';
 * import { SQS_ENVELOPE } from '@aws-lambda-powertools/parser/envelopes;'
 *
 * const oderSchema = z.object({
 *  id: z.number(),
 *  description: z.string(),
 *  quantity: z.number()
 * }
 *
 * type Order = z.infer<typeof orderSchema>;
 *
 * export class handler = middy(
 *  async(event: Order, _context: unknown): Promise<void> => {
 *    // event is validated as sqs message envelope
 *    // the body is unwrapped and parsed into object ready to use
 *    // you can now use event as Order in your code
 *  }
 * ).use(parser({ schema: oderSchema, envelope: SQS_ENVELOPE }));
 * ```
 *
 * @param options
 */
const parser = <S extends ZodSchema, E extends Envelope>(
  options: ParserOptions<S, E>
): MiddlewareObj => {
  const before = (request: MiddyLikeRequest): void => {
    const { schema, envelope } = options;
    if (envelope) {
      request.event = envelope.parse(request.event, schema);
    } else {
      request.event = schema.parse(request.event);
    }
  };

  return {
    before,
  };
};

export { parser };

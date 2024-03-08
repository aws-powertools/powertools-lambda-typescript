import { HandlerMethodDecorator } from '@aws-lambda-powertools/commons/types';
import { Context, Handler } from 'aws-lambda';
import { ZodSchema } from 'zod';
import { type ParserOptions } from './types/ParserOptions.js';

/**
 * A decorator to parse your event.
 *
 * @example
 * ```typescript
 *
 * import { parser } from '@aws-lambda-powertools/parser';
 * import { sqsEnvelope } from '@aws-lambda-powertools/parser/envelopes/sqs';
 *
 *
 * const Order = z.object({
 *  orderId: z.string(),
 *  description: z.string(),
 * }
 *
 * class Lambda extends LambdaInterface {
 *
 *   @parser({ envelope: sqsEnvelope, schema: OrderSchema })
 *   public async handler(event: Order, _context: Context): Promise<unknown> {
 *   // sqs event is parsed and the payload is extracted and parsed
 *   // apply business logic to your Order event
 *   const res = processOrder(event);
 *   return res;
 *   }
 * }
 *
 * @param options
 */
export const parser = <S extends ZodSchema>(
  options: ParserOptions<S>
): HandlerMethodDecorator => {
  return (_target, _propertyKey, descriptor) => {
    const original = descriptor.value!;

    const { schema, envelope } = options;

    descriptor.value = async function (
      this: Handler,
      event: unknown,
      context: Context,
      callback
    ) {
      const parsedEvent = envelope
        ? envelope(event, schema)
        : schema.parse(event);

      return original.call(this, parsedEvent, context, callback);
    };

    return descriptor;
  };
};

import type { HandlerMethodDecorator } from '@aws-lambda-powertools/commons/types';
import type { Context, Handler } from 'aws-lambda';
import { ZodSchema, z } from 'zod';
import { parse } from './parser.js';
import type { ParserOptions, ParsedResult } from './types/index.js';

/**
 * A decorator to parse your event.
 *
 * @example
 * ```typescript
 * import { z } from 'zod';
 * import type { LambdaInterface } from '@aws-lambda-powertools/commons/types';
 * import type { SqSEvent } from '@aws-lambda-powertools/parser/types;
 * import { parser } from '@aws-lambda-powertools/parser';
 * import { SqsEnvelope } from '@aws-lambda-powertools/parser/envelopes';
 *
 * const Order = z.object({
 *   orderId: z.string(),
 *   description: z.string(),
 * });
 *
 * class Lambda implements LambdaInterface {
 *
 *   ⁣@parser({ envelope: SqsEnvelope, schema: OrderSchema })
 *   public async handler(event: Order, _context: Context): Promise<unknown> {
 *   // sqs event is parsed and the payload is extracted and parsed
 *   // apply business logic to your Order event
 *   const res = processOrder(event);
 *   return res;
 *   }
 * }
 *
 * ```
 *
 * In case you want to parse the event and handle the error, you can use the safeParse option.
 * The safeParse option will return an object with the parsed event and an error object if the parsing fails.
 *
 * @example
 * ```typescript
 *
 * import type { LambdaInterface } from '@aws-lambda-powertools/commons/types';
 * import type { SqSEvent, ParsedResult } from '@aws-lambda-powertools/parser/types;
 * import { z } from 'zod';
 * import { parser } from '@aws-lambda-powertools/parser';
 * import { SqsEnvelope } from '@aws-lambda-powertools/parser/envelopes';
 *
 *
 * const Order = z.object({
 *   orderId: z.string(),
 *   description: z.string(),
 * }
 *
 * class Lambda implements LambdaInterface {
 *
 *   ⁣git@parser({ envelope: SqsEnvelope, schema: OrderSchema,  safeParse: true })
 *   public async handler(event: ParsedResult<Order>, _context: unknown): Promise<unknown> {
 *     if (event.success) {
 *      // event.data is the parsed event object of type Order
 *     } else {
 *      // event.error is the error object, you can inspect and recover
 *      // event.originalEvent is the original event that failed to parse
 *     }
 *   }
 * }
 * ```
 *
 * @param options Configure the parser with the `schema`, `envelope` and whether to `safeParse` or not
 */
export const parser = <S extends ZodSchema>(
  options: ParserOptions<S>
): HandlerMethodDecorator => {
  return (_target, _propertyKey, descriptor) => {
    const original = descriptor.value!;

    const { schema, envelope, safeParse } = options;

    descriptor.value = async function (
      this: Handler,
      event: unknown,
      context: Context,
      callback
    ) {
      const parsedEvent: ParsedResult<
        typeof event,
        z.infer<typeof schema>
      > = parse(event, envelope, schema, safeParse);

      return original.call(this, parsedEvent, context, callback);
    };

    return descriptor;
  };
};

import type { HandlerMethodDecorator } from '@aws-lambda-powertools/commons/types';
import type { StandardSchemaV1 } from '@standard-schema/spec';
import type { Callback, Context, Handler } from 'aws-lambda';
import { invokeErrorHandler, NO_RECOVERY } from './errorHandler.js';
import { parse } from './parser.js';
import type { Envelope, ParserOptions } from './types/index.js';
import type { ParserOutput } from './types/parser.js';

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
 *   @parser({ envelope: SqsEnvelope, schema: OrderSchema })
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
 *   @parser({ envelope: SqsEnvelope, schema: OrderSchema,  safeParse: true })
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
 * You can also provide an `errorHandler` callback to intercept parse errors and return a custom response
 * instead of throwing. If the handler returns `undefined`, the error is rethrown.
 *
 * @example
 * ```typescript
 * import type { LambdaInterface } from '@aws-lambda-powertools/commons/types';
 * import { z } from 'zod';
 * import { parser } from '@aws-lambda-powertools/parser';
 *
 * const Order = z.object({
 *   orderId: z.string(),
 *   description: z.string(),
 * });
 *
 * class Lambda implements LambdaInterface {
 *
 *   @parser({ schema: Order, errorHandler: (error) => ({ statusCode: 400, body: error.message }) })
 *   public async handler(event: z.infer<typeof Order>, _context: Context): Promise<unknown> {
 *     return processOrder(event);
 *   }
 * }
 * ```
 *
 * @param options Configure the parser with the `schema`, `envelope` and whether to `safeParse` or not
 */
export const parser = <
  TSchema extends StandardSchemaV1,
  TEnvelope extends Envelope = undefined,
  TSafeParse extends boolean = false,
  TErrorHandlerReturn = never,
>(
  options: ParserOptions<TSchema, TEnvelope, TSafeParse, TErrorHandlerReturn>
): HandlerMethodDecorator => {
  return (
    _target: unknown,
    _propertyKey: string | symbol,
    descriptor: PropertyDescriptor
  ) => {
    const original = descriptor.value;

    const { schema, envelope, safeParse, errorHandler } = options;

    descriptor.value = function (
      this: Handler,
      ...args: [ParserOutput<TSchema, TEnvelope, TSafeParse>, Context, Callback]
    ) {
      let parsedEvent: ParserOutput<TSchema, TEnvelope, TSafeParse>;
      try {
        parsedEvent = parse(
          args[0],
          envelope,
          schema,
          safeParse
        ) as ParserOutput<TSchema, TEnvelope, TSafeParse>;
      } catch (error) {
        // Only a failure of this parser's own `parse()` call goes through errorHandler - a
        // ParseError thrown by the wrapped handler body itself must propagate unchanged.
        const result = invokeErrorHandler(errorHandler, error, args[0]);
        if (result !== NO_RECOVERY) {
          return result;
        }
        throw error;
      }

      return original.apply(this, [parsedEvent, ...args.slice(1)]);
    };

    return descriptor;
  };
};

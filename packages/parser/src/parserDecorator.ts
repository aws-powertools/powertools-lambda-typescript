import type { HandlerMethodDecorator } from '@aws-lambda-powertools/commons/types';
import type { StandardSchemaV1 } from '@standard-schema/spec';
import type { Context, Handler } from 'aws-lambda';
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
 * @param options Configure the parser with the `schema`, `envelope` and whether to `safeParse` or not
 */
export const parser = <
  TSchema extends StandardSchemaV1,
  TEnvelope extends Envelope = undefined,
  TSafeParse extends boolean = false,
>(
  options: ParserOptions<TSchema, TEnvelope, TSafeParse>
): HandlerMethodDecorator => {
  return (_target, _propertyKey, descriptor) => {
    // biome-ignore lint/style/noNonNullAssertion: The descriptor.value is the method this decorator decorates, it cannot be undefined.
    const original = descriptor.value!;

    const { schema, envelope, safeParse } = options;

    descriptor.value = async function (
      this: Handler,
      event: ParserOutput<TSchema, TEnvelope, TSafeParse>,
      context: Context,
      callback
    ) {
      const parsedEvent = parse(event, envelope, schema, safeParse);

      return original.call(this, parsedEvent, context, callback);
    };

    return descriptor;
  };
};

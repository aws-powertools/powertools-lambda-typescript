import type { LambdaInterface } from '@aws-lambda-powertools/commons/types';
import { Logger } from '@aws-lambda-powertools/logger';
import { parser } from '@aws-lambda-powertools/parser';
import { EventBridgeSchema } from '@aws-lambda-powertools/parser/schemas/eventbridge';
import type { Context } from 'aws-lambda';
import { z } from 'zod';

const logger = new Logger();

const orderSchema = z.object({
  id: z.number().positive(),
  description: z.string(),
  items: z.array(
    z.object({
      id: z.number().positive(),
      quantity: z.number(),
      description: z.string(),
    })
  ),
  optionalField: z.string().optional(),
});

const orderEventSchema = EventBridgeSchema.extend({
  detail: orderSchema, // (1)!
});

type OrderEvent = z.infer<typeof orderEventSchema>;

class Lambda implements LambdaInterface {
  @parser({ schema: orderEventSchema }) // (2)!
  public async handler(event: OrderEvent, _context: Context): Promise<void> {
    for (const item of event.detail.items) {
      // process OrderItem
      logger.info('Processing item', { item }); // (3)!
    }
  }
}

const myFunction = new Lambda();
export const handler = myFunction.handler.bind(myFunction);

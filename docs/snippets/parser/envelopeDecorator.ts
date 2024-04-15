import type { Context } from 'aws-lambda';
import type { LambdaInterface } from '@aws-lambda-powertools/commons/types';
import { parser } from '@aws-lambda-powertools/parser';
import { z } from 'zod';
import { EventBridgeEnvelope } from '@aws-lambda-powertools/parser/envelopes';
import { Logger } from '@aws-lambda-powertools/logger';

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

type Order = z.infer<typeof orderSchema>;

class Lambda implements LambdaInterface {
  @parser({ schema: orderSchema, envelope: EventBridgeEnvelope }) // (1)!
  public async handler(event: Order, _context: Context): Promise<void> {
    // event is now typed as Order
    for (const item of event.items) {
      logger.info('Processing item', item); // (2)!
    }
  }
}

const myFunction = new Lambda();
export const handler = myFunction.handler.bind(myFunction);

import { Context } from 'aws-lambda';
import { LambdaInterface } from '@aws-lambda-powertools/commons';
import { parser } from '@aws-lambda-powertools/parser';
import { z } from 'zod';
import { eventBridgeEnvelope } from '@aws-lambda-powertools/parser/envelopes';

const orderItemSchema = z.object({
  id: z.number().positive(),
  quantity: z.number(),
  description: z.string(),
});

const orderSchema = z.object({
  id: z.number().positive(),
  description: z.string(),
  items: z.array(orderItemSchema),
  optionalField: z.string().optional(),
});

type Order = z.infer<typeof orderSchema>;

class Lambda extends LambdaInterface {
  @parser({ schema: orderSchema, envelope: eventBridgeEnvelope }) // (1)
  public async handler(event: Order, _context: Context): Promise<void> {
    for (const item of event.items) {
      // item is parsed as OrderItem (2)
      console.log(item.id);
    }
  }
}

const myFunction = new Lambda();
export const handler = myFunction.handler.bind(myFunction);

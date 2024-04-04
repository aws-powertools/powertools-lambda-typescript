import type { Context } from 'aws-lambda';
import type { LambdaInterface } from '@aws-lambda-powertools/commons/types';
import { parser } from '@aws-lambda-powertools/parser';
import { z } from 'zod';
import type {
  ParsedResult,
  EventBridgeEvent,
} from '@aws-lambda-powertools/parser/types';

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
  @parser({ schema: orderSchema, safeParse: true }) // (1)!
  public async handler(
    event: ParsedResult<EventBridgeEvent, Order>,
    _context: Context
  ): Promise<void> {
    if (event.success) {
      // (2)!
      for (const item of event.data.items) {
        console.log(item.id); // (3)!
      }
    } else {
      console.error(event.error); // (4)!
      console.log(event.originalEvent); // (5)!
    }
  }
}

const myFunction = new Lambda();
export const handler = myFunction.handler.bind(myFunction);

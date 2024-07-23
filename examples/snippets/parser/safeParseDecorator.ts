import type { LambdaInterface } from '@aws-lambda-powertools/commons/types';
import { Logger } from '@aws-lambda-powertools/logger';
import { parser } from '@aws-lambda-powertools/parser';
import { EventBridgeEnvelope } from '@aws-lambda-powertools/parser/envelopes';
import type {
  EventBridgeEvent,
  ParsedResult,
} from '@aws-lambda-powertools/parser/types';
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

type Order = z.infer<typeof orderSchema>;

class Lambda implements LambdaInterface {
  @parser({
    schema: orderSchema,
    envelope: EventBridgeEnvelope,
    safeParse: true,
  }) // (1)!
  public async handler(
    event: ParsedResult<EventBridgeEvent, Order>,
    _context: Context
  ): Promise<void> {
    if (event.success) {
      // (2)!
      for (const item of event.data.items) {
        logger.info('Processing item', { item }); // (3)!
      }
    } else {
      logger.error('Failed to parse event', event.error); // (4)!
      logger.error('Original event is: ', event.originalEvent); // (5)!
    }
  }
}

const myFunction = new Lambda();
export const handler = myFunction.handler.bind(myFunction);

import type { Context } from 'aws-lambda';
import { z } from 'zod';
import { EventBridgeEnvelope } from '@aws-lambda-powertools/parser/envelopes';
import { EventBridgeSchema } from '@aws-lambda-powertools/parser/schemas';
import type { EventBridgeEvent } from '@aws-lambda-powertools/parser/types';
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

export const handler = async (
  event: EventBridgeEvent,
  _context: Context
): Promise<void> => {
  const parsedEvent = EventBridgeSchema.parse(event); // (1)!
  logger.info('Parsed event', parsedEvent);

  const orders: Order = EventBridgeEnvelope.parse(event, orderSchema); // (2)!
  logger.info('Parsed orders', orders);
};

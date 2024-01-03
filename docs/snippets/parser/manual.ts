import { Context, EventBridgeEvent } from 'aws-lambda';
import { z } from 'zod';
import { eventBridgeEnvelope } from '@aws-lambda-powertools/parser/envelopes';
import { EventBridgeSchema } from '@aws-lambda-powertools/parser/schemas';

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

export const handler = async (
  event: EventBridgeEvent<string, unknown>,
  _context: Context
): Promise<void> => {
  const parsed = EventBridgeSchema.parse(event); // (1)
  console.log(parsed);

  const orders: Order[] = eventBridgeEnvelope(event, orderSchema); // (2)
  console.log(orders);
};

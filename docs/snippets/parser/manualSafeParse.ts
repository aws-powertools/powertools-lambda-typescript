import type { Context } from 'aws-lambda';
import { z } from 'zod';
import { EventBridgeEnvelope } from '@aws-lambda-powertools/parser/envelopes';
import { EventBridgeSchema } from '@aws-lambda-powertools/parser/schemas';
import type { EventBridgeEvent } from '@aws-lambda-powertools/parser/types';

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

export const handler = async (
  event: EventBridgeEvent,
  _context: Context
): Promise<void> => {
  const parsedEvent = EventBridgeSchema.safeParse(event); // (1)!
  parsedEvent.success
    ? console.log(parsedEvent.data)
    : console.log(parsedEvent.error.message);

  const parsedEvenlope = EventBridgeEnvelope.safeParse(event, orderSchema); // (2)!
  parsedEvenlope.success
    ? console.log(parsedEvenlope.data)
    : console.log(parsedEvenlope.error.message);
};

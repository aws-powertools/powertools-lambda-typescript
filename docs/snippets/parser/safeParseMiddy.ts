import type { Context } from 'aws-lambda';
import { parser } from '@aws-lambda-powertools/parser/middleware';
import { z } from 'zod';
import middy from '@middy/core';
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

const lambdaHandler = async (
  event: ParsedResult<EventBridgeEvent, Order>,
  _context: Context
): Promise<void> => {
  if (event.success) {
    // (2)!
    for (const item of event.data.items) {
      console.log(item.id); // (3)!
    }
  } else {
    console.error(event.error); // (4)!
    console.log(event.originalEvent); // (5)!
  }
};

export const handler = middy(lambdaHandler).use(
  parser({ schema: orderSchema, safeParse: true }) // (1)!
);

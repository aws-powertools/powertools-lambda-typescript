import { Logger } from '@aws-lambda-powertools/logger';
import { parser } from '@aws-lambda-powertools/parser/middleware';
import type {
  EventBridgeEvent,
  ParsedResult,
} from '@aws-lambda-powertools/parser/types';
import middy from '@middy/core';
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

const lambdaHandler = async (
  event: ParsedResult<EventBridgeEvent, Order>,
  _context: Context
): Promise<void> => {
  if (event.success) {
    // (2)!
    for (const item of event.data.items) {
      logger.info('Processing item', { item }); // (3)!
    }
  } else {
    logger.error('Error parsing event', { event: event.error }); // (4)!
    logger.error('Original event', { event: event.originalEvent }); // (5)!
  }
};

export const handler = middy(lambdaHandler).use(
  parser({ schema: orderSchema, safeParse: true }) // (1)!
);

import type { Context } from 'aws-lambda';
import { parser } from '@aws-lambda-powertools/parser/middleware';
import { z } from 'zod';
import middy from '@middy/core';
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

const lambdaHandler = async (
  event: Order,
  _context: Context
): Promise<void> => {
  for (const item of event.items) {
    // item is parsed as OrderItem
    logger.info('Processing item', { item });
  }
};

export const handler = middy(lambdaHandler).use(
  parser({ schema: orderSchema })
);

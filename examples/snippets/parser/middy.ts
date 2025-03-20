import { Logger } from '@aws-lambda-powertools/logger';
import { parser } from '@aws-lambda-powertools/parser/middleware';
import middy from '@middy/core';
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

export const handler = middy()
  .use(parser({ schema: orderSchema }))
  .handler(async (event): Promise<void> => {
    for (const item of event.items) {
      // item is parsed as OrderItem
      logger.info('Processing item', { item });
    }
  });

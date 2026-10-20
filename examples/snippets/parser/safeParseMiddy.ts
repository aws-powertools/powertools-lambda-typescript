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
  .use(
    parser({ schema: orderSchema, safeParse: true }) // (1)!
  )
  .handler(async (event): Promise<void> => {
    if (event.success) {
      for (const item of event.data.items) {
        logger.info('Processing item', { item }); // (2)!
      }
    } else {
      logger.error('Error parsing event', { event: event.error }); // (3)!
      logger.error('Original event', { event: event.originalEvent }); // (4)!
    }
  });

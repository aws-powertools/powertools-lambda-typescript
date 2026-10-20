import type { LambdaInterface } from '@aws-lambda-powertools/commons/types';
import { Logger } from '@aws-lambda-powertools/logger';
import { parser } from '@aws-lambda-powertools/parser';
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
    errorHandler: (error, event) => {
      // (1)!
      logger.error('Failed to parse event', { error, event }); // (2)!
      return { statusCode: 400, body: 'Invalid order payload' }; // (3)!
    },
  })
  public async handler(event: Order, _context: Context): Promise<void> {
    for (const item of event.items) {
      logger.info('Processing item', { item });
    }
  }
}

const myFunction = new Lambda();
export const handler = myFunction.handler.bind(myFunction);

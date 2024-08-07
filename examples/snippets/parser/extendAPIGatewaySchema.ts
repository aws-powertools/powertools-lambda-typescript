import type { LambdaInterface } from '@aws-lambda-powertools/commons/types';
import { Logger } from '@aws-lambda-powertools/logger';
import { parser } from '@aws-lambda-powertools/parser';
import { APIGatewayProxyEventSchema } from '@aws-lambda-powertools/parser/schemas';
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
});

const orderEventSchema = APIGatewayProxyEventSchema.extend({
  body: z
    .string()
    .transform((str, ctx) => {
      try {
        return JSON.parse(str); // (1)!
      } catch (err) {
        ctx.addIssue({
          code: 'custom',
          message: 'Invalid JSON',
        });
      }
    })
    .pipe(orderSchema), // (2)!
});

type OrderEvent = z.infer<typeof orderEventSchema>;

class Lambda implements LambdaInterface {
  @parser({ schema: orderEventSchema })
  public async handler(event: OrderEvent, _context: Context): Promise<void> {
    for (const item of event.body.items) {
      // process OrderItem
      logger.info('Processing item', { item });
    }
  }
}
const myFunction = new Lambda();
export const handler = myFunction.handler.bind(myFunction);

import type { LambdaInterface } from '@aws-lambda-powertools/commons/types';
import { parser } from '@aws-lambda-powertools/parser';
import { EventBridgeWithMetadataEnvelope } from '@aws-lambda-powertools/parser/envelopes';
import type { Context } from 'aws-lambda';
import { z } from 'zod';

const orderSchema = z.object({ orderId: z.string() });
type Order = z.infer<typeof orderSchema>;

class Lambda implements LambdaInterface {
  @parser({ schema: orderSchema, envelope: EventBridgeWithMetadataEnvelope })
  public async handler(orders: Order[], _context: Context): Promise<string[]> {
    return orders.map((order) => order.orderId);
  }
}

const lambda = new Lambda();
export const handler = lambda.handler.bind(lambda);

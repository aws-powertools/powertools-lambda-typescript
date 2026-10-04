import { EventBridgeWithMetadataEnvelope } from '@aws-lambda-powertools/parser/envelopes';
import { parser } from '@aws-lambda-powertools/parser/middleware';
import middy from '@middy/core';
import { z } from 'zod';

const orderSchema = z.object({ orderId: z.string() });

export const handler = middy()
  .use(
    parser({ schema: orderSchema, envelope: EventBridgeWithMetadataEnvelope })
  )
  .handler(async (orders) => orders.map((order) => order.orderId));

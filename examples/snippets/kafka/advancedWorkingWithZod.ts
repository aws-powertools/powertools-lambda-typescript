import { SchemaType, kafkaConsumer } from '@aws-lambda-powertools/kafka';
import type { SchemaConfig } from '@aws-lambda-powertools/kafka/types';
import { Logger } from '@aws-lambda-powertools/logger';
import { z } from 'zod/v4';

const logger = new Logger({ serviceName: 'kafka-consumer' });

const OrderItemSchema = z.object({
  productId: z.string(),
  quantity: z.number().int().positive(),
  price: z.number().positive(),
});

const OrderSchema = z.object({
  id: z.string(),
  customerId: z.string(),
  items: z.array(OrderItemSchema).min(1, 'Order must have at least one item'),
  createdAt: z.iso.datetime(),
  totalAmount: z.number().positive(),
});

const schemaConfig = {
  value: {
    type: SchemaType.JSON,
    parserSchema: OrderSchema,
  },
} satisfies SchemaConfig;

export const handler = kafkaConsumer<unknown, z.infer<typeof OrderSchema>>(
  async (event, _context) => {
    for (const {
      value: { id, items },
    } of event.records) {
      logger.setCorrelationId(id);
      logger.debug(`order includes ${items.length} items`);
    }
  },
  schemaConfig
);

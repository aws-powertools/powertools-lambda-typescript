import { kafkaConsumer, SchemaType } from '@aws-lambda-powertools/kafka';
import type { SchemaConfig } from '@aws-lambda-powertools/kafka/types';
import { Logger } from '@aws-lambda-powertools/logger';
import * as v from 'valibot';

const logger = new Logger({ serviceName: 'kafka-consumer' });

const OrderItemSchema = v.object({
  productId: v.string(),
  quantity: v.pipe(v.number(), v.integer(), v.toMinValue(1)),
  price: v.pipe(v.number(), v.integer()),
});

const OrderSchema = v.object({
  id: v.string(),
  customerId: v.string(),
  items: v.pipe(
    v.array(OrderItemSchema),
    v.minLength(1, 'Order must have at least one item')
  ),
  createdAt: v.pipe(v.string(), v.isoDateTime()),
  totalAmount: v.pipe(v.number(), v.toMinValue(0)),
});

const schemaConfig = {
  value: {
    type: SchemaType.JSON,
    parserSchema: OrderSchema,
  },
} satisfies SchemaConfig;

export const handler = kafkaConsumer<unknown, v.InferInput<typeof OrderSchema>>(
  async (event, _context) => {
    for (const record of event.records) {
      const {
        value: { id, items },
      } = record;
      logger.setCorrelationId(id);
      logger.debug(`order includes ${items.length} items`);
    }
  },
  schemaConfig
);

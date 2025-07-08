import { kafkaConsumer, SchemaType } from '@aws-lambda-powertools/kafka';
import type { SchemaConfig } from '@aws-lambda-powertools/kafka/types';
import { Logger } from '@aws-lambda-powertools/logger';
import { type } from 'arktype';

const logger = new Logger({ serviceName: 'kafka-consumer' });

const OrderItemSchema = type({
  productId: 'string',
  quantity: 'number.integer >= 1',
  price: 'number.integer',
});

const OrderSchema = type({
  id: 'string',
  customerId: 'string',
  items: OrderItemSchema.array().moreThanLength(0),
  createdAt: 'string.date',
  totalAmount: 'number.integer >= 0',
});

const schemaConfig = {
  value: {
    type: SchemaType.JSON,
    parserSchema: OrderSchema,
  },
} satisfies SchemaConfig;

export const handler = kafkaConsumer<unknown, typeof OrderSchema.infer>(
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

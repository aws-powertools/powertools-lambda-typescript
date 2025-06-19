const keySchema = `
{
  "type": "record",
  "name": "ProductKey",
  "fields": [
    {"name": "product_id", "type": "string"}
  ]
}
`;

const valueSchema = `
{
  "type": "record",
  "name": "ProductInfo",
  "fields": [
    {"name": "name", "type": "string"},
    {"name": "price", "type": "double"},
    {"name": "in_stock", "type": "boolean"}
  ]
}
`;

// --8<-- [start:types]

type ProductKey = {
  productId: string;
};

type ProductInfo = {
  name: string;
  price: number;
  inStock: boolean;
};

// --8<-- [end:types]

// --8<-- [start:func]

import { readFileSync } from 'node:fs';
import { SchemaType, kafkaConsumer } from '@aws-lambda-powertools/kafka';
import type { SchemaConfig } from '@aws-lambda-powertools/kafka/types';
import { Logger } from '@aws-lambda-powertools/logger';

const logger = new Logger({ serviceName: 'kafka-consumer' });

const schemaConfig = {
  key: {
    type: SchemaType.AVRO,
    schema: readFileSync(new URL('./ProductKey.avsc', import.meta.url), 'utf8'),
  },
  value: {
    type: SchemaType.AVRO,
    schema: readFileSync(
      new URL('./productInfo.avsc', import.meta.url),
      'utf8'
    ),
  },
} satisfies SchemaConfig;

export const handler = kafkaConsumer<ProductKey, ProductInfo>(
  async (event, _context) => {
    for (const { key, value } of event.records) {
      logger.info('processing product ID', { productId: key.productId });
      logger.info('product', { name: value.name, price: value.price });
    }
  },
  schemaConfig
);

// --8<-- [end:func]

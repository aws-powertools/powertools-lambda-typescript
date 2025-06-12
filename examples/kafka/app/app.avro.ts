import { kafkaConsumer } from '@aws-lambda-powertools/kafka';
import type { ConsumerRecords } from '@aws-lambda-powertools/kafka/types';
import { Logger } from '@aws-lambda-powertools/logger';
import type { Context } from 'aws-lambda';
import type { z } from 'zod';
import { productSchema } from './schema';

const logger = new Logger();

const schema = `{
  "type": "record",
  "name": "Product",
  "fields": [
    { "name": "id", "type": "int" },
    { "name": "name", "type": "string" },
    { "name": "price", "type": "double" }
  ]
}`;

type Product = z.infer<typeof productSchema>;

export const handler = kafkaConsumer<string, Product>(
  (event: ConsumerRecords<string, Product>, _context: Context) => {
    for (const record of event.records) {
      logger.info('Processing record with key: ', record.key);
      logger.info('Record value: ', record.value);
      // You can add more processing logic here
    }
  },
  {
    value: {
      type: 'avro',
      schema: schema,
      zodSchema: productSchema,
    },
  }
);

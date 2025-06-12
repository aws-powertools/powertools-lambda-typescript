import { kafkaConsumer } from '@aws-lambda-powertools/kafka';
import type { ConsumerRecords } from '@aws-lambda-powertools/kafka/types';
import { Logger } from '@aws-lambda-powertools/logger';
import type { Context } from 'aws-lambda';
import type z from 'zod';
import { Product as ProductProto } from './product.generated.js';
import { productSchema } from './schema.js';

const logger = new Logger();

type Product = z.infer<typeof productSchema>;

export const handler = kafkaConsumer<string, Product>(
  (event: ConsumerRecords<string, Product>, _context: Context) => {
    for (const record of event.records) {
      logger.info('Processing record with key: ', record.key);
      logger.info('Record value: ', record.value);
    }
  },
  {
    value: {
      type: 'protobuf',
      schema: ProductProto,
      zodSchema: productSchema,
    },
  }
);

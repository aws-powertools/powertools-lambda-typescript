import { kafkaConsumer } from '@aws-lambda-powertools/kafka';
import type { ConsumerRecords } from '@aws-lambda-powertools/kafka/types';
import { Logger } from '@aws-lambda-powertools/logger';
import type { Context } from 'aws-lambda';
import type z from 'zod';
import { productSchema } from './schema';

const logger = new Logger();
type Product = z.infer<typeof productSchema>;

export const handler = kafkaConsumer<string, Product>(
  (event: ConsumerRecords<string, Product>, _context: Context) => {
    for (const record of event.records) {
      logger.info(`Processing record with key: ${record.key}`);
      logger.info(`Record value: ${JSON.stringify(record.value)}`);
      // You can add more processing logic here
    }
  },
  {
    value: {
      type: 'json',
      zodSchema: productSchema,
    },
  }
);

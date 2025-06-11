import { kafkaConsumer } from '@aws-lambda-powertools/kafka';
import type { ConsumerRecords } from '@aws-lambda-powertools/kafka/types';
import { Logger } from '@aws-lambda-powertools/logger';
import type { Context } from 'aws-lambda';
import { Product } from './product.generated.js';

const logger = new Logger();
type Value = {
  id: number;
  name: string;
  price: number;
};

export const handler = kafkaConsumer<string, Value>(
  (event: ConsumerRecords<string, Value>, _context: Context) => {
    for (const record of event.records) {
      logger.info(`Processing record with key: ${record.key}`);
      logger.info(`Record value: ${JSON.stringify(record.value)}`);
    }
  },
  {
    value: {
      type: 'protobuf',
      schema: Product,
    },
  }
);

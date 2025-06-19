import { SchemaType, kafkaConsumer } from '@aws-lambda-powertools/kafka';
import type { SchemaConfig } from '@aws-lambda-powertools/kafka/types';
import { Logger } from '@aws-lambda-powertools/logger';

const logger = new Logger({ serviceName: 'kafka-consumer' });

const schemaConfig = {
  value: {
    type: SchemaType.JSON,
  },
} satisfies SchemaConfig;

export const handler = kafkaConsumer(async (event, _context) => {
  for (const { value } of event.records) {
    logger.info('received value', { value });
  }
}, schemaConfig);

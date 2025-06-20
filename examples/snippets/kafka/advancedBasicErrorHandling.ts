declare function processRecord(record: unknown): Promise<void>;

import { readFileSync } from 'node:fs';
import { SchemaType, kafkaConsumer } from '@aws-lambda-powertools/kafka';
import { KafkaConsumerDeserializationError } from '@aws-lambda-powertools/kafka/errors';
import type {
  ConsumerRecord,
  SchemaConfig,
} from '@aws-lambda-powertools/kafka/types';
import { Logger } from '@aws-lambda-powertools/logger';

const logger = new Logger({ serviceName: 'kafka-consumer' });

const schemaConfig = {
  value: {
    type: SchemaType.AVRO,
    schema: readFileSync(new URL('./user.avsc', import.meta.url), 'utf8'),
  },
} satisfies SchemaConfig;

export const handler = kafkaConsumer(async (event, _context) => {
  const results: {
    successful: number;
    failed: Array<ConsumerRecord<unknown, unknown>>;
  } = {
    successful: 0,
    failed: [],
  };
  for (const record of event.records) {
    try {
      const { value, partition, offset, topic } = record; // (1)!
      logger.setCorrelationId(`${topic}-${partition}-${offset}`);

      await processRecord(value);

      results.successful += 1;
    } catch (error) {
      if (error instanceof KafkaConsumerDeserializationError) {
        results.failed.push(record);
        logger.error('Error deserializing message', { error });
      } else {
        logger.error('Error processing message', { error });
      }
    }

    if (results.failed.length > 0) {
      // Handle failed records, e.g., send to a dead-letter queue
    }

    logger.info('Successfully processed records', {
      successful: results.successful,
    });
  }
}, schemaConfig);

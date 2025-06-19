import { SchemaType, kafkaConsumer } from '@aws-lambda-powertools/kafka';
import type { SchemaConfig } from '@aws-lambda-powertools/kafka/types';
import { Logger } from '@aws-lambda-powertools/logger';
import { User } from './samples/user.es6.generated.js'; // protobuf generated class

const logger = new Logger({ serviceName: 'kafka-consumer' });

const schemaConfig = {
  value: {
    type: SchemaType.PROTOBUF,
    schema: User,
  },
} satisfies SchemaConfig;

export const handler = kafkaConsumer(async (event, _context) => {
  for (const { value } of event.records) {
    logger.info('received value', { value });
  }
}, schemaConfig);

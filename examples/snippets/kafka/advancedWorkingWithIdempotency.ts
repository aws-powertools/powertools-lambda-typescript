import {
  IdempotencyConfig,
  makeIdempotent,
} from '@aws-lambda-powertools/idempotency';
import { DynamoDBPersistenceLayer } from '@aws-lambda-powertools/idempotency/dynamodb';
import { kafkaConsumer, SchemaType } from '@aws-lambda-powertools/kafka';
import type { SchemaConfig } from '@aws-lambda-powertools/kafka/types';
import { Logger } from '@aws-lambda-powertools/logger';
import { com } from './samples/user.generated.js'; // protobuf generated class

const logger = new Logger({ serviceName: 'kafka-consumer' });
const persistenceStore = new DynamoDBPersistenceLayer({
  tableName: 'IdempotencyTable',
});

const schemaConfig = {
  value: {
    type: SchemaType.PROTOBUF,
    schema: com.example.User,
  },
} satisfies SchemaConfig;

const processRecord = makeIdempotent(
  async (user, topic, partition, offset) => {
    logger.info('processing user', {
      user,
      meta: {
        topic,
        partition,
        offset,
      },
    });

    // ...your business logic here

    return {
      success: true,
      user,
    };
  },
  {
    persistenceStore,
    config: new IdempotencyConfig({
      eventKeyJmesPath: `topic & '-' & partition & '-' & offset`,
    }),
  }
);

export const handler = kafkaConsumer(async (event, _context) => {
  for (const { value, topic, partition, offset } of event.records) {
    await processRecord(value, topic, partition, offset);
  }
}, schemaConfig);

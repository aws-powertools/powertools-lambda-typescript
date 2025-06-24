import {
  IdempotencyConfig,
  makeIdempotent,
} from '@aws-lambda-powertools/idempotency';
import { DynamoDBPersistenceLayer } from '@aws-lambda-powertools/idempotency/dynamodb';
import { SchemaType, kafkaConsumer } from '@aws-lambda-powertools/kafka';
import type { SchemaConfig } from '@aws-lambda-powertools/kafka/types';
import { Logger } from '@aws-lambda-powertools/logger';
import { User } from './samples/user.es6.generated.js'; // protobuf generated class

const logger = new Logger({ serviceName: 'kafka-consumer' });
const persistenceStore = new DynamoDBPersistenceLayer({
  tableName: 'IdempotencyTable',
});

const schemaConfig = {
  value: {
    type: SchemaType.PROTOBUF,
    schema: User,
  },
} satisfies SchemaConfig;

const processRecord = makeIdempotent(
  async (user, topic, partition, offset) => {
    logger.info('processing user', {
      userId: user.id,
      meta: {
        topic,
        partition,
        offset,
      },
    });

    // ...your business logic here

    return {
      success: true,
      userId: user.id,
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

import { kafkaConsumer, SchemaType } from '@aws-lambda-powertools/kafka';
import { Logger } from '@aws-lambda-powertools/logger';
import { com } from './samples/user.generated.js'; // protobuf generated class

const logger = new Logger({ serviceName: 'kafka-consumer' });

export const handler = kafkaConsumer<unknown, com.example.IUser>(
  async (event, _context) => {
    for (const record of event.records) {
      const { value, topic, partition, offset, timestamp, headers } = record;
      logger.info(`processing message from topic ${topic}`, {
        partition,
        offset,
        timestamp,
      });

      if (headers) {
        for (const header of headers) {
          logger.debug(`Header: ${header.key}`, {
            value: header.value,
          });
        }
      }

      // Process the deserialized value
      logger.info('User data', {
        userName: value.name,
        userAge: value.age,
      });
    }
  },
  {
    value: {
      type: SchemaType.PROTOBUF,
      schema: com.example.User,
    },
  }
);

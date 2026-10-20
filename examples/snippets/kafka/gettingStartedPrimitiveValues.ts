import { kafkaConsumer } from '@aws-lambda-powertools/kafka';
import { Logger } from '@aws-lambda-powertools/logger';

const logger = new Logger({ serviceName: 'kafka-consumer' });

export const handler = kafkaConsumer<string, { name: string; age: number }>(
  async (event, _context) => {
    for (const record of event.records) {
      // Key is automatically decoded as UTF-8 string
      const { key } = record;
      // Value is parsed as JSON object
      const { value } = record;

      logger.info('received value', {
        key,
        product: {
          name: value.name,
          age: value.age,
        },
      });
    }
  }
);

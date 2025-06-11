import { kafkaConsumer } from '@aws-lambda-powertools/kafka';
import type { ConsumerRecords } from '@aws-lambda-powertools/kafka/types';
import { Logger } from '@aws-lambda-powertools/logger';
import type { Context } from 'aws-lambda';

const logger = new Logger();

type Value = {
  id: number;
  name: string;
  price: number;
};

const schema = `{
  "type": "record",
  "name": "Product",
  "fields": [
    { "name": "id", "type": "int" },
    { "name": "name", "type": "string" },
    { "name": "price", "type": "double" }
  ]
}`;

export const handler = kafkaConsumer<string, Value>(
  (event: ConsumerRecords<string, Value>, _context: Context) => {
    for (const record of event.records) {
      logger.info(`Processing record with key: ${record.key}`);
      logger.info(`Record value: ${JSON.stringify(record.value)}`);
      // You can add more processing logic here
    }
  },
  {
    value: {
      type: 'avro',
      schema: schema,
    },
  }
);

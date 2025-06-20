declare function processRecordFromS3({
  key,
  bucket,
}: { key: string; bucket: string }): Promise<void>;

import { kafkaConsumer } from '@aws-lambda-powertools/kafka';
import { Logger } from '@aws-lambda-powertools/logger';
import { object, safeParse, string } from 'valibot';

const logger = new Logger({ serviceName: 'kafka-consumer' });

const LargeMessage = object({
  key: string(),
  bucket: string(),
});

export const handler = kafkaConsumer(async (event, _context) => {
  for (const record of event.records) {
    const { topic, value, originalValue } = record;
    const valueSize = Buffer.byteLength(originalValue, 'utf8');
    const parsedValue = safeParse(LargeMessage, value);
    if (
      topic === 'product-catalog' &&
      valueSize > 3_000_000 &&
      parsedValue.success
    ) {
      logger.info('Large message detected, processing from S3', {
        size: valueSize,
      });

      const { key, bucket } = parsedValue.output;
      await processRecordFromS3({ key, bucket });

      logger.info('Processed large message from S3', {
        key,
        bucket,
      });
    }

    // regular processing of the record
  }
});

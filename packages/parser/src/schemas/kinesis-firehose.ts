import { z } from 'zod';
import { SqsRecordSchema } from './sqs.js';

const KinesisRecordMetaData = z.object({
  shardId: z.string(),
  partitionKey: z.string(),
  approximateArrivalTimestamp: z.number().positive(),
  sequenceNumber: z.string(),
  subsequenceNumber: z.number(),
});

const KinesisFireHoseRecordBase = z.object({
  recordId: z.string(),
  approximateArrivalTimestamp: z.number().positive(),
  kinesisRecordMetaData: KinesisRecordMetaData.optional(),
});

const KinesisFireHoseBaseSchema = z.object({
  invocationId: z.string(),
  deliveryStreamArn: z.string(),
  region: z.string(),
  sourceKinesisStreamArn: z.string().optional(),
});

const KinesisFirehoseRecord = KinesisFireHoseRecordBase.extend({
  data: z
    .string()
    .transform((data) => Buffer.from(data, 'base64').toString('utf8')),
});

const KinesisFirehoseSqsRecord = KinesisFireHoseRecordBase.extend({
  data: z.string().transform((data) => {
    try {
      return SqsRecordSchema.parse(
        JSON.parse(Buffer.from(data, 'base64').toString('utf8'))
      );
    } catch (e) {
      return data;
    }
  }),
});

const KinesisFirehoseSchema = KinesisFireHoseBaseSchema.extend({
  records: z.array(KinesisFirehoseRecord),
});

const KinesisFirehoseSqsSchema = KinesisFireHoseBaseSchema.extend({
  records: z.array(KinesisFirehoseSqsRecord),
});

export { KinesisFirehoseSchema, KinesisFirehoseSqsSchema };

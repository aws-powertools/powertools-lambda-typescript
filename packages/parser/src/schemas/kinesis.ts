import { z } from 'zod';

const KinesisDataStreamRecordPayload = z.object({
  kinesisSchemaVersion: z.string(),
  partitionKey: z.string(),
  sequenceNumber: z.string(),
  approximateArrivalTimestamp: z.number(),
  data: z.string(),
});

const KinesisDataStreamRecord = z.object({
  eventSource: z.literal('aws:kinesis'),
  eventVersion: z.string(),
  eventID: z.string(),
  eventName: z.literal('aws:kinesis:record'),
  invokeIdentityArn: z.string(),
  eventSourceARN: z.string(),
  kinesis: KinesisDataStreamRecordPayload,
});

const KinesisDataStreamSchema = z.object({
  Records: z.array(KinesisDataStreamRecord),
});

export {
  KinesisDataStreamSchema,
  KinesisDataStreamRecord,
  KinesisDataStreamRecordPayload,
};

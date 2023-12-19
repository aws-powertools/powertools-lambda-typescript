import { z } from 'zod';
import { gunzipSync } from 'node:zlib';

const KinesisDataStreamRecordPayload = z.object({
  kinesisSchemaVersion: z.string(),
  partitionKey: z.string(),
  sequenceNumber: z.string(),
  approximateArrivalTimestamp: z.number(),
  data: z.string().transform((data) => {
    const decompresed = decompress(data);
    const decoded = Buffer.from(data, 'base64').toString('utf-8');
    try {
      // If data was not compressed, try to parse it as JSON otherwise it must be string
      return decompresed === data ? JSON.parse(decoded) : decompresed;
    } catch (e) {
      return decoded;
    }
  }),
});

const decompress = (data: string): string => {
  try {
    return JSON.parse(gunzipSync(Buffer.from(data, 'base64')).toString('utf8'));
  } catch (e) {
    return data;
  }
};

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
